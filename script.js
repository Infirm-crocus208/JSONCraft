let current = "ts"
let liveMode = false

// ─── Type helpers ────────────────────────────────────────────────────────────

function typeOf(v) {
  if (Array.isArray(v)) return "array"
  if (v === null) return "any"
  if (typeof v === "string") return "string"
  if (typeof v === "number") return Number.isInteger(v) ? "int" : "float"
  if (typeof v === "boolean") return "boolean"
  if (typeof v === "object") return "object"
  return "any"
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Model walker ────────────────────────────────────────────────────────────

function walk(obj, name, models) {
  let fields = []
  for (let k in obj) {
    let v = obj[k]
    let t = typeOf(v)
    if (t === "object") {
      let child = name + capitalize(k)
      walk(v, child, models)
      fields.push({ key: k, type: child, raw: t })
    } else if (t === "array") {
      if (v.length > 0 && typeof v[0] === "object" && v[0] !== null) {
        let child = name + capitalize(k)
        walk(v[0], child, models)
        fields.push({ key: k, type: child + "[]", raw: "array-object", child })
      } else {
        let inner = v.length > 0 ? typeOf(v[0]) : "any"
        fields.push({ key: k, type: inner + "[]", raw: "array-primitive", inner })
      }
    } else {
      fields.push({ key: k, type: t, raw: t })
    }
  }
  models[name] = fields
}

function buildModels(data) {
  let models = {}
  walk(data, "Model", models)
  return models
}

// ─── TypeScript ──────────────────────────────────────────────────────────────

function makeTS(models) {
  let out = ""
  for (let m in models) {
    out += `interface ${m} {\n`
    models[m].forEach(f => {
      let t = f.type
      if (t === "int" || t === "float") t = "number"
      if (t === "int[]" || t === "float[]") t = "number[]"
      out += `  ${f.key}: ${t}\n`
    })
    out += `}\n\n`
  }
  return out.trim()
}

// ─── Python ──────────────────────────────────────────────────────────────────

function makePython(models) {
  let out = "from dataclasses import dataclass\nfrom typing import List, Optional, Any\n\n"
  // reverse so dependencies come first
  let keys = Object.keys(models).reverse()
  keys.forEach(m => {
    out += `@dataclass\nclass ${m}:\n`
    models[m].forEach(f => {
      let t = f.type
      if (t === "string") t = "str"
      else if (t === "int") t = "int"
      else if (t === "float") t = "float"
      else if (t === "boolean") t = "bool"
      else if (t === "any") t = "Any"
      else if (t.endsWith("[]")) {
        let inner = t.slice(0, -2)
        if (inner === "string") inner = "str"
        else if (inner === "int" || inner === "float") inner = inner
        else if (inner === "boolean") inner = "bool"
        else if (inner === "any") inner = "Any"
        t = `List[${inner}]`
      }
      out += `    ${f.key}: ${t}\n`
    })
    out += "\n"
  })
  return out.trim()
}

// ─── GraphQL ─────────────────────────────────────────────────────────────────

function makeGraph(models) {
  let out = ""
  for (let m in models) {
    out += `type ${m} {\n`
    models[m].forEach(f => {
      let t = f.type
      if (t === "string") t = "String"
      else if (t === "int") t = "Int"
      else if (t === "float") t = "Float"
      else if (t === "boolean") t = "Boolean"
      else if (t === "any") t = "JSON"
      else if (t.endsWith("[]")) {
        let inner = t.slice(0, -2)
        if (inner === "string") inner = "String"
        else if (inner === "int") inner = "Int"
        else if (inner === "float") inner = "Float"
        else if (inner === "boolean") inner = "Boolean"
        else if (inner === "any") inner = "JSON"
        t = `[${inner}]`
      }
      out += `  ${f.key}: ${t}\n`
    })
    out += `}\n\n`
  }
  return out.trim()
}

// ─── SQL ─────────────────────────────────────────────────────────────────────

function makeSQL(models) {
  let out = ""
  for (let m in models) {
    out += `CREATE TABLE ${m.toLowerCase()} (\n`
    let fields = models[m]
    fields.forEach((f, i) => {
      let t = f.type
      if (t === "string") t = "TEXT"
      else if (t === "int") t = "INTEGER"
      else if (t === "float") t = "REAL"
      else if (t === "boolean") t = "BOOLEAN"
      else t = "JSON"
      out += `  ${f.key} ${t}`
      if (i < fields.length - 1) out += ","
      out += "\n"
    })
    out += `);\n\n`
  }
  return out.trim()
}

// ─── Go ──────────────────────────────────────────────────────────────────────

function makeGo(models) {
  let out = "package main\n\n"
  for (let m in models) {
    out += `type ${m} struct {\n`
    models[m].forEach(f => {
      let key = capitalize(f.key)
      let t = f.type
      if (t === "string") t = "string"
      else if (t === "int") t = "int"
      else if (t === "float") t = "float64"
      else if (t === "boolean") t = "bool"
      else if (t === "any") t = "interface{}"
      else if (t.endsWith("[]")) {
        let inner = t.slice(0, -2)
        if (inner === "string") inner = "string"
        else if (inner === "int") inner = "int"
        else if (inner === "float") inner = "float64"
        else if (inner === "boolean") inner = "bool"
        else if (inner === "any") inner = "interface{}"
        t = `[]${inner}`
      }
      out += `  ${key} ${t} \`json:"${f.key}"\`\n`
    })
    out += `}\n\n`
  }
  return out.trim()
}

// ─── Rust ────────────────────────────────────────────────────────────────────

function makeRust(models) {
  let out = "use serde::{Deserialize, Serialize};\n\n"
  for (let m in models) {
    out += `#[derive(Debug, Serialize, Deserialize)]\npub struct ${m} {\n`
    models[m].forEach(f => {
      let t = f.type
      if (t === "string") t = "String"
      else if (t === "int") t = "i64"
      else if (t === "float") t = "f64"
      else if (t === "boolean") t = "bool"
      else if (t === "any") t = "serde_json::Value"
      else if (t.endsWith("[]")) {
        let inner = t.slice(0, -2)
        if (inner === "string") inner = "String"
        else if (inner === "int") inner = "i64"
        else if (inner === "float") inner = "f64"
        else if (inner === "boolean") inner = "bool"
        else if (inner === "any") inner = "serde_json::Value"
        t = `Vec<${inner}>`
      }
      out += `  pub ${f.key}: ${t},\n`
    })
    out += `}\n\n`
  }
  return out.trim()
}

// ─── Java ────────────────────────────────────────────────────────────────────

function makeJava(models) {
  let out = ""
  for (let m in models) {
    out += `public class ${m} {\n\n`
    // fields
    models[m].forEach(f => {
      let t = javaType(f.type)
      out += `    private ${t} ${f.key};\n`
    })
    out += "\n"
    // constructor
    out += `    public ${m}() {}\n\n`
    // getters & setters
    models[m].forEach(f => {
      let t = javaType(f.type)
      let cap = capitalize(f.key)
      out += `    public ${t} get${cap}() { return ${f.key}; }\n`
      out += `    public void set${cap}(${t} ${f.key}) { this.${f.key} = ${f.key}; }\n`
    })
    out += `}\n\n`
  }
  return out.trim()
}

function javaType(t) {
  if (t === "string") return "String"
  if (t === "int") return "int"
  if (t === "float") return "double"
  if (t === "boolean") return "boolean"
  if (t === "any") return "Object"
  if (t.endsWith("[]")) {
    let inner = javaType(t.slice(0, -2))
    return `List<${inner === "int" ? "Integer" : inner === "boolean" ? "Boolean" : inner === "double" ? "Double" : inner}>`
  }
  return t
}

// ─── Kotlin ──────────────────────────────────────────────────────────────────

function makeKotlin(models) {
  let out = ""
  for (let m in models) {
    out += `data class ${m}(\n`
    let fields = models[m]
    fields.forEach((f, i) => {
      let t = f.type
      if (t === "string") t = "String"
      else if (t === "int") t = "Int"
      else if (t === "float") t = "Double"
      else if (t === "boolean") t = "Boolean"
      else if (t === "any") t = "Any?"
      else if (t.endsWith("[]")) {
        let inner = t.slice(0, -2)
        if (inner === "string") inner = "String"
        else if (inner === "int") inner = "Int"
        else if (inner === "float") inner = "Double"
        else if (inner === "boolean") inner = "Boolean"
        else if (inner === "any") inner = "Any?"
        t = `List<${inner}>`
      }
      out += `    val ${f.key}: ${t}`
      if (i < fields.length - 1) out += ","
      out += "\n"
    })
    out += `)\n\n`
  }
  return out.trim()
}

// ─── Zod ─────────────────────────────────────────────────────────────────────

function makeZod(models) {
  let out = 'import { z } from "zod"\n\n'
  let keys = Object.keys(models).reverse()
  keys.forEach(m => {
    let varName = m.charAt(0).toLowerCase() + m.slice(1) + "Schema"
    out += `const ${varName} = z.object({\n`
    models[m].forEach(f => {
      let t = f.type
      let z = zodType(t, models, m)
      out += `  ${f.key}: ${z},\n`
    })
    out += `})\n\n`
    out += `export type ${m} = z.infer<typeof ${varName}>\n\n`
  })
  return out.trim()
}

function zodType(t, models, currentModel) {
  if (t === "string") return "z.string()"
  if (t === "int") return "z.number().int()"
  if (t === "float") return "z.number()"
  if (t === "boolean") return "z.boolean()"
  if (t === "any") return "z.unknown()"
  if (t.endsWith("[]")) {
    let inner = zodType(t.slice(0, -2), models, currentModel)
    return `z.array(${inner})`
  }
  // nested object ref
  let varName = t.charAt(0).toLowerCase() + t.slice(1) + "Schema"
  return varName
}

// ─── Prisma ──────────────────────────────────────────────────────────────────

function makePrisma(models) {
  let out = `// Prisma schema generated by JSONCraft\n// Add your datasource and generator blocks above\n\n`
  for (let m in models) {
    out += `model ${m} {\n`
    out += `  id  Int  @id @default(autoincrement())\n`
    models[m].forEach(f => {
      let t = f.type
      if (t === "string") t = "String"
      else if (t === "int") t = "Int"
      else if (t === "float") t = "Float"
      else if (t === "boolean") t = "Boolean"
      else if (t === "any") t = "Json?"
      else if (t.endsWith("[]")) t = "Json"
      else t = t + "?"  // relation — mark optional
      out += `  ${f.key}  ${t}\n`
    })
    out += `}\n\n`
  }
  return out.trim()
}

// ─── Core convert ────────────────────────────────────────────────────────────

function convert() {
  let text = document.getElementById("json").value.trim()
  let status = document.getElementById("status")
  let output = document.getElementById("output")

  if (!text) {
    status.textContent = ""
    output.textContent = ""
    return
  }

  let obj
  try {
    obj = JSON.parse(text)
    status.textContent = "✓ Valid JSON"
    status.style.color = "#4ade80"
  } catch (e) {
    status.textContent = "✗ Invalid JSON — " + e.message
    status.style.color = "#f87171"
    output.textContent = ""
    return
  }

  let models = buildModels(obj)
  let result = ""

  if (current === "ts")      result = makeTS(models)
  if (current === "python")  result = makePython(models)
  if (current === "graphql") result = makeGraph(models)
  if (current === "sql")     result = makeSQL(models)
  if (current === "go")      result = makeGo(models)
  if (current === "rust")    result = makeRust(models)
  if (current === "java")    result = makeJava(models)
  if (current === "kotlin")  result = makeKotlin(models)
  if (current === "zod")     result = makeZod(models)
  if (current === "prisma")  result = makePrisma(models)

  output.textContent = result
}

// ─── Tab switching ───────────────────────────────────────────────────────────

document.querySelectorAll(".tabs button").forEach(b => {
  b.onclick = function () {
    document.querySelectorAll(".tabs button").forEach(x => x.classList.remove("active"))
    this.classList.add("active")
    current = this.dataset.tab
    convert()
  }
})

// ─── Buttons ─────────────────────────────────────────────────────────────────

document.getElementById("convert").onclick = convert

document.getElementById("copy").onclick = function () {
  let t = document.getElementById("output").textContent
  if (!t) return
  navigator.clipboard.writeText(t)
  showToast("Copied to clipboard!")
}

document.getElementById("download").onclick = function () {
  let text = document.getElementById("output").textContent
  if (!text) return
  const exts = { ts: "ts", python: "py", graphql: "graphql", sql: "sql", go: "go", rust: "rs", java: "java", kotlin: "kt", zod: "ts", prisma: "prisma" }
  let ext = exts[current] || "txt"
  let blob = new Blob([text])
  let a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `model.${ext}`
  a.click()
}

document.getElementById("format").onclick = function () {
  let t = document.getElementById("json")
  try {
    let obj = JSON.parse(t.value)
    t.value = JSON.stringify(obj, null, 2)
    showToast("JSON formatted!")
  } catch {
    showToast("Invalid JSON — cannot format")
  }
}

document.getElementById("clear").onclick = function () {
  document.getElementById("json").value = ""
  document.getElementById("output").textContent = ""
  document.getElementById("status").textContent = ""
}

document.getElementById("sample").onclick = function () {
  document.getElementById("json").value = `{
  "user": {
    "id": 1,
    "name": "Alex",
    "email": "alex@mail.com",
    "active": true,
    "score": 9.5,
    "profile": {
      "age": 24,
      "country": "Denmark"
    }
  },
  "posts": [
    {
      "id": 10,
      "title": "Hello",
      "likes": 12
    }
  ]
}`
  convert()
}

document.getElementById("theme").onclick = function () {
  document.body.classList.toggle("light")
}

// ─── Live mode ───────────────────────────────────────────────────────────────

document.getElementById("live-toggle").onclick = function () {
  liveMode = !liveMode
  this.classList.toggle("active", liveMode)
  showToast(liveMode ? "Live mode on" : "Live mode off")
}

document.getElementById("json").addEventListener("input", function () {
  if (liveMode) convert()
})

// ─── Drag & drop ─────────────────────────────────────────────────────────────

const dropOverlay = document.getElementById("drop-overlay")
const jsonArea = document.getElementById("json")
const wrap = document.querySelector(".box")

jsonArea.addEventListener("dragover", e => {
  e.preventDefault()
  dropOverlay.classList.add("active")
})

jsonArea.addEventListener("dragleave", () => {
  dropOverlay.classList.remove("active")
})

jsonArea.addEventListener("drop", e => {
  e.preventDefault()
  dropOverlay.classList.remove("active")
  let file = e.dataTransfer.files[0]
  if (!file) return
  if (!file.name.endsWith(".json") && file.type !== "application/json") {
    showToast("Please drop a .json file")
    return
  }
  let reader = new FileReader()
  reader.onload = ev => {
    jsonArea.value = ev.target.result
    convert()
    showToast(`Loaded ${file.name}`)
  }
  reader.readAsText(file)
})

// ─── URL import ──────────────────────────────────────────────────────────────

document.getElementById("url-import-btn").onclick = function () {
  let bar = document.getElementById("url-bar")
  bar.style.display = bar.style.display === "none" ? "flex" : "none"
}

document.getElementById("url-cancel").onclick = function () {
  document.getElementById("url-bar").style.display = "none"
  document.getElementById("url-input").value = ""
}

document.getElementById("url-fetch").onclick = async function () {
  let url = document.getElementById("url-input").value.trim()
  if (!url) return showToast("Enter a URL first")

  this.textContent = "Fetching..."
  this.disabled = true

  try {
    let res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    let text = await res.text()
    // validate it's JSON
    JSON.parse(text)
    document.getElementById("json").value = text
    document.getElementById("url-bar").style.display = "none"
    document.getElementById("url-input").value = ""
    convert()
    showToast("JSON imported from URL!")
  } catch (e) {
    showToast("Failed: " + e.message)
  } finally {
    this.textContent = "Fetch"
    this.disabled = false
  }
}

// Allow pressing Enter in URL input
document.getElementById("url-input").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("url-fetch").click()
})

// ─── Toast helper ─────────────────────────────────────────────────────────────

function showToast(msg) {
  let t = document.getElementById("toast")
  t.textContent = msg
  t.classList.add("show")
  clearTimeout(t._timer)
  t._timer = setTimeout(() => t.classList.remove("show"), 2200)
}
