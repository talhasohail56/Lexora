declare module "pdf-parse" {
  interface PDFInfo { [k: string]: any }
  interface PDFData {
    text: string;
    info: PDFInfo;
    metadata: any;
    version: string;
    numpages: number;
  }
  function pdfParse(dataBuffer: Buffer, options?: any): Promise<PDFData>;
  export = pdfParse;
}
