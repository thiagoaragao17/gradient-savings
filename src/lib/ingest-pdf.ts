'use server'

import { parseHelcimText } from './helcim-parse'
import type { ParsedProspect } from './helcim-parse'

export async function ingestFromPdf(
  formData: FormData
): Promise<{ data?: ParsedProspect; error?: string }> {
  try {
    const file = formData.get('pdf') as File | null
    if (!file) return { error: 'No file provided.' }
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return { error: 'Please upload a PDF file.' }
    }
    if (file.size > 10 * 1024 * 1024) {
      return { error: 'File too large (max 10 MB).' }
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdfBytes = new Uint8Array(arrayBuffer)

    const { extractText, getDocumentProxy } = await import('unpdf')
    const pdf = await getDocumentProxy(pdfBytes)
    const { text } = await extractText(pdf, { mergePages: true })

    if (!text?.trim()) return { error: 'Could not extract text from PDF.' }

    const data = parseHelcimText(text)

    if (!data.company_name && !data.total_volume && !data.current_monthly_cost) {
      return { error: 'Could not find comparison data in this PDF. Make sure it is a Helcim comparison PDF.' }
    }

    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to parse PDF.' }
  }
}
