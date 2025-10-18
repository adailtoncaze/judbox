import test from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import Module from "node:module"

const distRoot = path.resolve(__dirname, "..")

const moduleAny = Module as unknown as {
  _resolveFilename: (request: string, parent: any, isMain: boolean, options: any) => string
}
const originalResolveFilename = moduleAny._resolveFilename.bind(Module)
moduleAny._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
  if (request.startsWith("@/")) {
    const absolute = path.join(distRoot, request.slice(2))
    return originalResolveFilename(absolute, parent, isMain, options)
  }
  return originalResolveFilename(request, parent, isMain, options)
}

const saveAsCalls: any[] = []
const saveAsMock = (...args: any[]) => {
  saveAsCalls.push(args)
}

let currentHandlers: Record<string, () => any> = {}

const supabaseMock = {
  from(table: string) {
    const handler = currentHandlers[table]
    if (!handler) {
      throw new Error(`No handler configured for table ${table}`)
    }
    return handler()
  },
}

function setSupabaseHandlers(handlers: Record<string, () => any>) {
  currentHandlers = handlers
}

function resetSupabaseHandlers() {
  currentHandlers = {}
}

function resetSaveAs() {
  saveAsCalls.length = 0
}

function createShowToastMock() {
  const calls: [string, string | undefined][] = []
  const fn = (message: string, type?: string) => {
    calls.push([message, type])
  }
  return { fn, calls }
}

function mockDate(iso: string) {
  const RealDate = Date
  const fixedInstant = new RealDate(iso).valueOf()

  class MockDate extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(fixedInstant)
      } else {
        super(...(args as [any]))
      }
    }

    static now() {
      return fixedInstant
    }
  }

  Object.assign(MockDate, { UTC: RealDate.UTC, parse: RealDate.parse })
  global.Date = MockDate as unknown as DateConstructor

  return () => {
    global.Date = RealDate
  }
}

const supabaseModulePath = path.join(distRoot, "lib", "supabaseClient.js")
;(require.cache as Record<string, NodeModule | undefined>)[supabaseModulePath] = {
  id: supabaseModulePath,
  filename: supabaseModulePath,
  loaded: true,
  exports: { supabase: supabaseMock },
} as unknown as NodeModule

const fileSaverModulePath = require.resolve("file-saver")
;(require.cache as Record<string, NodeModule | undefined>)[fileSaverModulePath] = {
  id: fileSaverModulePath,
  filename: fileSaverModulePath,
  loaded: true,
  exports: { saveAs: saveAsMock },
} as unknown as NodeModule

const exportCsvModulePath = path.join(distRoot, "components", "exportCsv.js")
const { exportDocsAdm, exportProcJud, exportProcAdm } = require(exportCsvModulePath)

test("exportDocsAdm exports CSV with combined destinations", async () => {
  setSupabaseHandlers({
    documentos_adm: () => ({
      select: () =>
        Promise.resolve({
          data: [
            {
              especie_documental: "Relatório",
              data_limite: "2024-01-01",
              quantidade_caixas: 2,
              numero_caixas: "CX1, CX2",
              observacao: "Observação",
            },
          ],
          error: null,
        }),
    }),
    caixas: () => ({
      select: () => ({
        in: () =>
          Promise.resolve({
            data: [
              { numero_caixa: "CX1", destinacao: "Arquivo Morto" },
              { numero_caixa: "CX2", destinacao: "Arquivo Externo" },
            ],
            error: null,
          }),
      }),
    }),
  })

  resetSaveAs()
  const toast = createShowToastMock()
  const restoreDate = mockDate("2024-01-15T12:00:00Z")
  try {
    await exportDocsAdm(toast.fn)
  } finally {
    restoreDate()
    resetSupabaseHandlers()
  }

  assert.equal(saveAsCalls.length, 1, "saveAs should be called once")
  const [blob, filename] = saveAsCalls[0]
  assert.equal(filename, "documentos_adm_2024-01-15.csv")
  const text = await blob.text()
  assert.equal(
    text,
    "Espécie Documental,Data Limite,Quantidade de Caixas,Número das Caixas,Destinação,Observação\n" +
      '"Relatório","2024-01-01","2","CX1, CX2","Arquivo Morto; Arquivo Externo","Observação"\n'
  )

  assert.deepEqual(toast.calls, [["Relatório de Documentos Administrativos exportado com sucesso!", "success"]])
})

test("exportDocsAdm warns when there is no data", async () => {
  setSupabaseHandlers({
    documentos_adm: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
    }),
  })

  resetSaveAs()
  const toast = createShowToastMock()
  await exportDocsAdm(toast.fn)
  resetSupabaseHandlers()

  assert.equal(saveAsCalls.length, 0, "saveAs should not be called when there is no data")
  assert.deepEqual(toast.calls, [["Nenhum documento administrativo encontrado.", "error"]])
})

test("exportProcJud uses fallback destinations when nested data is missing", async () => {
  setSupabaseHandlers({
    processos: () => ({
      select: () => ({
        eq: () =>
          Promise.resolve({
            data: [
              {
                caixas: { numero_caixa: "CJ1", tipo: "processo_judicial", destinacao: null },
                classe_processual: "Classe",
                numero_processo: "123",
                protocolo: "456",
                ano: "2022",
                quantidade_volumes: 3,
                numero_caixas: "2",
                observacao: "Obs",
              },
            ],
            error: null,
          }),
      }),
    }),
    caixas: () => ({
      select: () => ({
        in: () =>
          Promise.resolve({
            data: [{ numero_caixa: "CJ1", destinacao: "Arquivo Histórico" }],
            error: null,
          }),
      }),
    }),
  })

  resetSaveAs()
  const toast = createShowToastMock()
  const restoreDate = mockDate("2024-02-01T00:00:00Z")
  try {
    await exportProcJud(toast.fn)
  } finally {
    restoreDate()
    resetSupabaseHandlers()
  }

  assert.equal(saveAsCalls.length, 1)
  const [blob, filename] = saveAsCalls[saveAsCalls.length - 1]
  assert.equal(filename, "processos_judiciais_2024-02-01.csv")
  const text = await blob.text()
  assert.ok(
    text.includes('"CJ1","Classe","123","456","2022","3","2","Arquivo Histórico","Obs"'),
    "CSV should contain the fallback destination"
  )
  assert.deepEqual(toast.calls, [["Relatório de Processos Judiciais exportado com sucesso!", "success"]])
})

test("exportProcAdm reports errors from Supabase", async () => {
  setSupabaseHandlers({
    processos: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: null, error: new Error("falha geral") }),
      }),
    }),
  })

  resetSaveAs()
  const toast = createShowToastMock()
  await exportProcAdm(toast.fn)
  resetSupabaseHandlers()

  assert.equal(saveAsCalls.length, 0)
  assert.equal(toast.calls.length, 1)
  const [message, type] = toast.calls[0]
  assert.equal(type, "error")
  assert.ok(
    message.includes("Erro ao exportar processos administrativos: falha geral"),
    "Should surface the Supabase error message"
  )
})
