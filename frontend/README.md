# Frontend do ERP para Estudos

SPA em **Vue 3 + Vite + TypeScript**, com componentes shadcn-vue sobre Reka UI e Tailwind CSS 4. Consome a API Laravel de `backend/` ([ADR-0016](../docs/adr/0016-frontend-em-vue.md)).

```bash
npm install
npm run dev          # http://<prefeitura>.localhost:5173
npm run typecheck    # vue-tsc
npm run lint
npm run format:check
npm test
npm run build
```

A documentação completa está em [`docs/`](../docs/README.md); para criar uma tela, veja [Como criar uma tela](../docs/guias/criar-tela.md).
