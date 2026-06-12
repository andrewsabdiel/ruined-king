# Ruined King Fan Site

Fan site estático inspirado em Viego, o Rei Destruído, com uma experiência visual cinematográfica, timeline interativa e seção dedicada à espada Santidade.

## Visão Geral

- Hero com vídeo de fundo e tela de carregamento.
- Timeline dinâmica alimentada por JSON.
- Galeria temática com imagens, vídeos e fontes locais.
- Estrutura pronta para GitHub Pages, Netlify ou qualquer hospedagem estática.

## Estrutura

```text
assets/
  fonts/
  icons/
  images/
  videos/
css/
  main.css
data/
  timeline.json
js/
  app.js
scripts/
  dev-server.py
index.html
```

## Desenvolvimento Local

Rode o servidor local sem cache:

```bash
python scripts/dev-server.py
```

Depois acesse:

```text
http://localhost:4173
```

## Deploy

Como o projeto é estático, basta publicar a raiz do repositório. Para GitHub Pages, use:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/root`

## Créditos

Projeto criado como fan site sem afiliação oficial com Riot Games. League of Legends, Ruined King, Viego e materiais relacionados pertencem aos seus respectivos proprietários.
