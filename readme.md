# JSONCraft

Turn JSON into developer models instantly.

JSONCraft converts raw JSON into multiple programming language models directly in the browser. Paste JSON and generate TypeScript interfaces, Python classes, GraphQL types, and SQL tables in seconds.

---

## Features

* Convert JSON to multiple developer formats
* TypeScript interface generator
* Python class generator
* GraphQL schema generator
* SQL table generator
* Nested object support
* Array detection
* JSON validation
* JSON formatter
* Copy generated output
* Download generated files
* Sample JSON generator
* Dark / light theme
* Runs completely in the browser

---

## Supported Conversions

JSONCraft currently supports:

* JSON → TypeScript
* JSON → Python
* JSON → GraphQL
* JSON → SQL

Example input:

```json
{
  "user": {
    "id": 1,
    "name": "Alex",
    "email": "alex@mail.com",
    "active": true
  }
}
```

Example output (TypeScript):

```ts
interface Model {
  user: ModelUser
}

interface ModelUser {
  id: number
  name: string
  email: string
  active: boolean
}
```

---

## Demo

Run locally by opening:

```
index.html
```
or open here: https://js0ncraft.netlify.app/
---

## Installation

Clone the repository.

```
git clone https://github.com/Ghost-Sellz/JSONCraft
```

Open the project folder and run:

```
index.html
```

No dependencies required.

---

## Project Structure

```
jsoncraft
│
├── index.html
├── style.css
└── script.js
```

---

## Roadmap

Planned improvements:

* Go struct generator
* Rust struct generator
* Java class generator
* Kotlin data class generator
* Zod schema generation
* Prisma schema generator
* Monaco editor integration
* Drag & drop JSON files
* Import JSON from API URL
* CLI version
* Live conversion mode

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## License

MIT License

---

## Why JSONCraft?

Developers constantly convert JSON API responses into data models.
JSONCraft removes the manual work and generates models instantly.

---

## Star the project

If this project helped you, consider giving it a star.
