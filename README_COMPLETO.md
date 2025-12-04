# 🏢 EspaçoGo - Plataforma de Aluguel de Espaços

![EspaçoGo Logo](espacoGO.jpg)

## 📋 Sobre o Projeto

**EspaçoGo** é uma plataforma web completa para anúncio e busca de espaços para eventos, reuniões e hospedagens em Goiânia. O projeto foi desenvolvido como parte do meu portfólio profissional, demonstrando habilidades em desenvolvimento front-end e back-end com JavaScript puro (Vanilla JS).

### 🎯 Objetivo

Criar uma aplicação web moderna, segura e funcional que permita aos usuários:
- Buscar e filtrar espaços disponíveis
- Criar anúncios de seus próprios espaços
- Avaliar e favoritar espaços
- Gerenciar seus anúncios de forma intuitiva

---

## ✨ Funcionalidades Principais

### 🔐 Autenticação e Segurança
- ✅ Sistema completo de login e registro
- ✅ Hash de senhas para segurança
- ✅ Validações robustas em todos os formulários
- ✅ Proteção contra XSS (Cross-Site Scripting)
- ✅ Verificação de permissões antes de editar/deletar

### 🏠 Gerenciamento de Espaços
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Upload de múltiplas imagens (até 10)
- ✅ Galeria de imagens com navegação
- ✅ Categorização por tipo de evento
- ✅ Detalhamento de recursos disponíveis

### 🔍 Busca e Filtros Avançados
- ✅ Busca por texto (título, descrição, localização)
- ✅ Filtros por categoria
- ✅ Filtros por preço e capacidade
- ✅ Ordenação (recentes, preço, avaliação, popularidade)
- ✅ Paginação para melhor performance

### ⭐ Sistema de Avaliações
- ✅ Avaliação com sistema de estrelas (1-5)
- ✅ Comentários detalhados
- ✅ Cálculo automático de rating médio
- ✅ Histórico de avaliações

### ❤️ Favoritos
- ✅ Adicionar/remover favoritos
- ✅ Página dedicada para favoritos
- ✅ Contador de favoritos na navbar

### 🎨 Interface e UX
- ✅ Design moderno e responsivo
- ✅ Dark Mode (tema claro/escuro)
- ✅ Notificações Toast elegantes
- ✅ Loading states e animações suaves
- ✅ Modais para confirmações
- ✅ Mobile-first approach

### 📱 Progressive Web App (PWA)
- ✅ Manifest.json configurado
- ✅ Instalável em dispositivos móveis
- ✅ Ícones para todas as resoluções

---

## 🛠️ Tecnologias Utilizadas

### Front-end
- **HTML5** - Estrutura semântica
- **CSS3** - Estilos modernos com variáveis CSS e Grid/Flexbox
- **JavaScript (ES6+)** - Lógica da aplicação (Vanilla JS, sem frameworks)

### Bibliotecas Externas
- **Font Awesome 6.4** - Ícones
- **Google Fonts (Inter)** - Tipografia moderna

### Armazenamento
- **Local Storage** - Persistência de dados no navegador

### Padrões e Boas Práticas
- ✅ SEO otimizado (meta tags, Open Graph)
- ✅ Acessibilidade (ARIA labels, navegação por teclado)
- ✅ Código limpo e documentado
- ✅ Separação de responsabilidades
- ✅ Mobile-first responsive design

---

## 📁 Estrutura do Projeto

```
espacogo/
├── index.html              # Página principal
├── app.js                  # Lógica da aplicação
├── styles.css              # Estilos CSS
├── manifest.json           # Configuração PWA
├── README.md              # Documentação
└── assets/
    ├── icons/             # Ícones do app
    └── screenshots/       # Screenshots do projeto
```

---

## 🚀 Como Executar

### Opção 1: Abrir diretamente
1. Clone ou baixe o repositório
2. Abra o arquivo `index.html` em um navegador moderno
3. Pronto! A aplicação estará funcionando

### Opção 2: Servidor local (recomendado)
```bash
# Com Python 3
python -m http.server 8000

# Com Node.js (npx)
npx serve

# Acesse: http://localhost:8000
```

---

## 📖 Guia de Uso

### Para Usuários

1. **Buscar Espaços**
   - Use a barra de busca na página inicial
   - Aplique filtros por categoria, preço e capacidade
   - Clique nos cards para ver detalhes completos

2. **Criar Conta**
   - Clique em "Entrar" → "Cadastre-se"
   - Preencha seus dados
   - Senha deve ter mínimo 6 caracteres com letras e números

3. **Anunciar Espaço**
   - Faça login
   - Vá em "Meus Espaços" → "Novo Anúncio"
   - Preencha todos os campos obrigatórios
   - Adicione URLs de imagens (uma por linha)
   - Publique!

4. **Gerenciar Anúncios**
   - Acesse "Meus Espaços"
   - Edite ou delete seus anúncios
   - Veja estatísticas (visualizações, avaliações)

### Para Desenvolvedores

#### Principais Funções JavaScript

```javascript
// Autenticação
login(email, password)
register(name, email, password, confirmPassword)
logout()

// Espaços
saveListing(listing)
deleteListing(id)
getListingById(id)

// Favoritos
toggleFavorite(listingId)
getFavorites()

// Avaliações
addReview(listingId, rating, comment)
renderStars(rating)

// Navegação
navigate(page)
```

#### Estrutura de Dados

```javascript
// Usuário
{
  id: string,
  name: string,
  email: string,
  password: string (hashed),
  avatar: string (URL),
  favorites: array,
  reviews: array,
  createdAt: ISO Date
}

// Espaço/Anúncio
{
  id: string,
  title: string,
  description: string,
  category: string,
  price: number,
  periodo: string,
  city: string,
  localizacao: string,
  capacidade: number,
  imagens: array,
  recursos: array,
  whatsapp: string,
  userId: string,
  rating: number,
  reviewCount: number,
  views: number,
  createdAt: ISO Date
}
```

---

## 🎨 Customização

### Cores (Variáveis CSS)
Edite em `styles.css`:

```css
:root {
  --azul-principal: #2563eb;
  --azul-escuro: #1e40af;
  --verde-whatsapp: #25D366;
  /* ... outras variáveis */
}
```

### Configurações da Aplicação
Edite em `app.js`:

```javascript
const CONFIG = {
    APP_NAME: 'EspaçoGo',
    VERSION: '2.0.0',
    MAX_IMAGES: 10,
    ITEMS_PER_PAGE: 9,
    TOAST_DURATION: 3000
};
```

---

## 🔒 Segurança

### Medidas Implementadas

1. **Sanitização de Inputs**
   - Todos os inputs de usuário são sanitizados antes de serem exibidos
   - Prevenção contra XSS (Cross-Site Scripting)

2. **Hash de Senhas**
   - Senhas não são armazenadas em texto puro
   - Utiliza função de hash simples (em produção, use bcrypt)

3. **Validações**
   - Validação de email (regex)
   - Validação de senha (mínimo 6 caracteres, letras e números)
   - Validação de WhatsApp (formato brasileiro)
   - Validação de dados antes de salvar

4. **Permissões**
   - Usuários só podem editar/deletar seus próprios anúncios
   - Verificações de autenticação em operações sensíveis

---

## 📱 Responsividade

O projeto é totalmente responsivo, com breakpoints em:
- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px

Todos os componentes foram testados em diferentes dispositivos.

---

## 🌟 Diferenciais do Projeto

### Técnicos
- ✅ **Vanilla JavaScript** - Sem dependência de frameworks
- ✅ **Código Limpo** - Documentado e organizado
- ✅ **Performance** - Otimizações de carregamento e renderização
- ✅ **Acessibilidade** - WCAG 2.1 compliant
- ✅ **SEO** - Meta tags e estrutura semântica

### Funcionais
- ✅ **Sistema Completo** - CRUD, autenticação, favoritos, avaliações
- ✅ **UX Moderna** - Dark mode, loading states, notificações
- ✅ **Validações Robustas** - Em todos os formulários
- ✅ **Segurança** - Hash de senhas, sanitização XSS

---

## 🎓 Aprendizados

Este projeto demonstra conhecimento em:
- Manipulação do DOM
- Event handling
- Local Storage API
- ES6+ features (arrow functions, template literals, destructuring)
- Programação assíncrona
- Design responsivo
- Acessibilidade web
- Segurança em aplicações web

---

## 📈 Melhorias Futuras

- [ ] Backend real com Node.js e MongoDB
- [ ] Upload real de imagens
- [ ] Sistema de mensagens entre usuários
- [ ] Integração com API de mapas
- [ ] Sistema de pagamento online
- [ ] Notificações push
- [ ] Chat em tempo real
- [ ] Testes automatizados

---

## 👤 Autor

**Leonardo Brito**
- Desenvolvedor Web Full Stack
- Portfolio: [seu-portfolio.com]
- LinkedIn: [linkedin.com/in/seu-perfil]
- GitHub: [github.com/seu-usuario]
- Email: contato@exemplo.com

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 🙏 Agradecimentos

- Font Awesome pela biblioteca de ícones
- Google Fonts pela fonte Inter
- Unsplash pelas imagens de exemplo
- Comunidade dev pela inspiração

---

## 📞 Contato

Dúvidas ou sugestões? Entre em contato:
- 📧 Email: contato@espacogo.com.br
- 💼 LinkedIn: [seu-linkedin]
- 🐱 GitHub Issues: [link-do-repo/issues]

---

⭐ Se este projeto foi útil, considere dar uma estrela no GitHub!

**Desenvolvido com ❤️ por Leonardo Brito - 2025**
