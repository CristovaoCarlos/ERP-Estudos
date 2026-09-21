import * as pdfjs from 'pdfjs-dist'

// Worker como módulo ES: o Nginx não serve .mjs com MIME de JavaScript.
pdfjs.GlobalWorkerOptions.workerPort = new Worker(
  new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
  { type: 'module' },
)

export { pdfjs }
