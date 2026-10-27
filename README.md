# LF Leads — plataforma independente

O LF Leads será publicado separadamente do site institucional da LF Intermediação.

## Endereço próprio
Sugestão de endereço: `leads.lfintermediacao.com.br` (subdomínio próprio).  
Outra opção é registrar um domínio separado, se preferir.

## Publicação inicial no GitHub Pages
1. Crie um repositório separado, por exemplo `lf-leads`.
2. Envie `index.html`, `style.css` e `app.js` para a raiz do repositório.
3. Em Settings → Pages, habilite a publicação pelo branch principal e pela pasta raiz.
4. Depois que o GitHub fornecer o endereço, configure o subdomínio no provedor DNS:
   - Tipo: CNAME
   - Nome: `leads`
   - Destino: o endereço `SEU-USUARIO.github.io` indicado nas configurações do GitHub Pages.
5. Em Settings → Pages → Custom domain, informe `leads.lfintermediacao.com.br` e aguarde a validação do DNS e a emissão do certificado HTTPS.

Os nomes exatos dos menus podem mudar. Siga os valores de DNS mostrados no próprio GitHub Pages e no painel do seu provedor.

## Importante antes de usar com dados reais
Esta é uma versão inicial de interface e gestão comercial. Os dados ficam no `localStorage` do navegador, portanto:
- não há sincronização entre computadores ou usuários;
- limpar os dados do navegador pode apagar os registros;
- não existe login/autenticação nesta versão;
- não coloque dados confidenciais ou documentos pessoais nela.

Antes de usar em produção, a próxima etapa recomendada é conectar um banco de dados com autenticação (por exemplo, Supabase), aplicar controle de acesso, backups e políticas de privacidade.

## Recursos já incluídos
- Dashboard comercial;
- cadastro, edição e exclusão de empresas;
- filtros por etapa, estado e segmento;
- importação e exportação CSV;
- funil comercial;
- verificação básica de duplicidade por CNPJ.

A pesquisa automática externa ainda depende de integração com fontes de dados autorizadas.
