# Terminal Notes

Crie um aplicativo web chamado “NO EXCUSES”, focado em anotações mentais e organização de estudos.

Conceito

O aplicativo deve funcionar como uma espécie de biblioteca pessoal de conhecimento, onde o usuário pode criar diferentes áreas de estudo, por exemplo:

Linguagem C

Cybersegurança

Java

Linux

Redes

Matemática

Outros

Dentro de cada área, o usuário poderá criar, editar, visualizar e excluir notas.

Interface

A interface deve ser:

Minimalista

Intuitiva

Rápida

Fácil de navegar

Sem excesso de botões ou elementos visuais

Com aparência inspirada em terminal Linux

Fundo preto ou cinza muito escuro

Tipografia monoespaçada

Poucas cores, utilizadas apenas para destacar informações importantes

Visual limpo e profissional

O nome “NO EXCUSES” deve aparecer no topo da aplicação.

O logo deve ser um chapeuzinho estilo Fedora, simples e minimalista.

Sistema de cores

Utilize poucas cores e com bastante contraste.

Exemplo:

Nome das áreas/tópicos: amarelo

Título das notas: vermelho ou azul

Texto normal: branco/cinza claro

Elementos selecionados: uma cor de destaque discreta

Quando o usuário utilizar "" ou (), destacar automaticamente esse trecho com uma cor diferente, como amarelo, mantendo boa legibilidade.

Exemplo visual:

[ Linguagem C ]

> MATRIZES E VETORES

Matriz é uma estrutura utilizada para armazenar dados em linhas e colunas.

"int matriz[3][3]" → trecho destacado

(linha, coluna) → trecho destacado

Organização

A tela inicial deve funcionar como uma biblioteca.

Mostrar as áreas de estudo de maneira simples:

NO EXCUSES
────────────────────────────

> STUDY LIBRARY

[ C ]
[ CYBERSEGURANÇA ]
[ JAVA ]
[ LINUX ]
[ REDES ]

+ NOVA ÁREA


Ao entrar em uma área:

NO EXCUSES / C
────────────────────────────

> NOTES

[ MATRIZES E VETORES ]
[ POINTERS ]
[ STRUCTS ]
[ FUNÇÕES ]
[ LOOPS ]

+ NOVA NOTA


Ao abrir uma nota, mostrar o conteúdo de forma confortável para leitura e edição.

Funcionalidades

Implementar:

Criar áreas de estudo

Renomear áreas

Excluir áreas

Criar notas dentro das áreas

Editar notas

Excluir notas

Título da nota

Conteúdo da nota

Pesquisa de notas

Navegação simples entre áreas e notas

Indicador de última edição

Autosave

Persistência dos dados utilizando localStorage

O aplicativo deve continuar funcionando sem internet depois de carregado

PWA

O aplicativo deve ser desenvolvido como uma PWA (Progressive Web App).

Implementar:

manifest.json

Service Worker

Cache dos arquivos necessários

Instalação no desktop e celular

Funcionamento offline

Interface responsiva

Armazenamento

Não utilizar backend inicialmente.

Todos os dados devem ser armazenados localmente utilizando localStorage.

A estrutura dos dados deve ser organizada de forma que futuramente seja fácil adicionar:

Exportação das notas

Importação das notas

Backup

Sincronização em nuvem

Tags

Markdown

Experiência

Priorize simplicidade e velocidade.

Não transformar o aplicativo em um clone do Notion.

A ideia é parecer uma biblioteca pessoal de conhecimento dentro de um terminal, onde abrir o aplicativo e escrever uma anotação seja extremamente rápido.

Evite:

Gradientes exagerados

Muitas cores

Animações desnecessárias

Cards gigantes

Elementos chamativos

Menus complexos

Interface cheia de informações

O resultado deve transmitir a sensação de:

“Abri meu terminal. Tenho algo para aprender. Vou anotar.”

Antes de implementar, analise a arquitetura do projeto e escolha uma estrutura simples e sustentável. Depois implemente a aplicação completa, garantindo que todas as funcionalidades estejam funcionando e que os dados não sejam perdidos ao recarregar ou fechar o navegador.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/85f8d302-e0ed-4c48-9ba2-cb66e2eec931).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
