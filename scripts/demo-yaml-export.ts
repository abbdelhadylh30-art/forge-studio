/**
 * Demo: generate a real YAML export from the built-in SaaS "Vertex" template,
 * using the project's own configToYaml (the exact function behind the
 * Studio's "Export YAML" button), then verify it round-trips back.
 */
import { writeFileSync } from "node:fs"
import { TEMPLATES } from "../src/lib/landing/defaults"
import { configToYaml, yamlToConfig } from "../src/lib/landing/yaml"

const saas = TEMPLATES.find((t) => t.id === "saas")
if (!saas) throw new Error("saas template missing")

const config = saas.build()
const yaml = configToYaml(config)
writeFileSync("/home/z/my-project/download/vertex-demo.yml", yaml)

// round-trip proof: YAML -> config -> deep-equal sections count
const back = yamlToConfig(yaml)
console.log("=== ROUND-TRIP CHECK ===")
console.log("sections:", config.sections.length, "->", back.sections.length)
console.log("theme:", config.themeId, "->", back.themeId)
console.log("brand:", config.brand.name, "->", back.brand.name)
console.log("bytes:", yaml.length)
