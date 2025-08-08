# Deploy Manual - Quem Mente Menos? 🚀

## Opções de Deploy Gratuito

### 🥇 **1. VERCEL (Recomendado)**

#### Pré-requisitos:
- Conta GitHub (gratuita)
- Conta Vercel (gratuita)

#### Passos:
1. **Push do código para GitHub**:
   ```bash
   git add .
   git commit -m "Preparar para deploy"
   git push origin main
   ```

2. **Deploy no Vercel**:
   - Acesse: https://vercel.com/
   - Login com GitHub
   - Clique "New Project"
   - Selecione este repositório
   - Deploy automático! 🎉

#### ✅ **Vantagens**:
- Deploy automático a cada push
- HTTPS gratuito
- CDN global
- Domínio personalizado gratuito

---

### 🥈 **2. RAILWAY**

#### Passos:
1. Acesse: https://railway.app/
2. Login com GitHub
3. "Deploy from GitHub repo"
4. Selecione este repositório
5. Railway detecta Node.js automaticamente

#### ✅ **Vantagens**:
- $5/mês de créditos grátis
- Banco de dados PostgreSQL incluso
- Logs detalhados

---

### 🥉 **3. RENDER**

#### Passos:
1. Acesse: https://render.com/
2. "New +" → "Web Service"
3. Conecte GitHub repo
4. Configure:
   - Build Command: `cd backend && npm ci && npm run build`
   - Start Command: `cd backend && npm start`

#### ✅ **Vantagens**:
- PostgreSQL gratuito
- SSL automático
- Deploy por Git push

---

### 🐳 **4. Deploy via Docker (Universal)**

#### Se você tem Docker instalado:
1. **Criar Dockerfile** (já criado no projeto)
2. **Deploy em qualquer plataforma**:
   - fly.io (grátis)
   - Google Cloud Run (grátis)
   - AWS ECS (grátis com limites)

---

## 🎯 **Recomendação Imediata:**

### **Use o VERCEL** - É o mais simples:

1. **Agora mesmo**: Faça push do código para GitHub
2. **Em 5 minutos**: Deploy estará online no Vercel
3. **URL gratuita**: `https://seu-projeto.vercel.app`

---

## 📦 **Deploy Manual com Pacote ZIP**

Se preferir upload manual:

### **Netlify Drop**:
1. Acesse: https://app.netlify.com/drop
2. Arraste o arquivo `backend-staging.zip`
3. URL instantânea!

### **Surge.sh**:
```bash
npm install -g surge
cd backend/dist
surge
# Seguir instruções
```

---

## 🚨 **Qual você prefere?**

Digite o número:
1. **Vercel** (mais fácil)
2. **Railway** (com banco grátis)
3. **Render** (mais completo)
4. **Manual upload** (mais rápido)
