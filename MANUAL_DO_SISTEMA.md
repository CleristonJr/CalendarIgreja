![7 Flow Logo](./7FlowLogo.jpeg)

# 7 Flow
## Manual do Sistema: Agenda Inteligente para Igrejas

**Geração Automática, Organização e Gestão Colaborativa para sua Liderança**

---

### Resumo do Sistema

O **7 Flow** é uma plataforma robusta e moderna desenvolvida para centralizar a gestão de eventos, ministérios e voluntariados de uma igreja. Com uma arquitetura multi-igreja focada na colaboração inteligente, o sistema permite que as lideranças abandonem planilhas e grupos confusos de mensagens para organizar toda a liturgia (Doxologia), escalar equipes inter-departamentais e programar eventos recorrentes de forma totalmente visual e instantânea.

Além da parte gerencial, ele fornece a toda membresia um Portal Público e interativo para que saibam com clareza (através de uma interface responsiva, limpa e amigável para celulares) todos os horários e o que a liderança preparou de programação.

---

## 🛡️ 1. Arquitetura Multi-Igreja e Perfis de Acesso (Roles)

O sistema opera em um modelo onde cada Igreja possui o seu próprio ambiente isolado da rede (baseado em um endereço personalizável "Slug"). A hierarquia máxima dita o que cada pessoa vê:

- 👑 **Superadmin:** Acesso irrestrito a todas as diferentes igrejas instanciadas na plataforma, sendo o gerente raiz do banco de dados e de acessos de infraestrutura.
- 🏛️ **Ancião (Administrador Local):** Possui controle total para gerir as engrenagens da sua respectiva congregação e editar escalas irrestritamente de toda e qualquer congregação associada. Ele edita grupos, escala voluntários de todo lugar, atualiza a logo global, gerencia as credenciais da equipe matriz.
- 🧑‍💼 **Líder de Departamento:** Seu poder de intervenção é restrito cirurgicamente aos eventos em que *o seu próprio departamento* é curador principal, ou naqueles onde ele foi requisitado como "Colaborador".
- 👥 **Membro / Visitante Público:** Possui modo super focado, apenas de leitura. Acessa o painel geral da Igreja a fim de se localizar semanalmente sem enxergar atalhos ocultos.

---

## 🧑‍💻 2. Cadastro de Credenciais (Login e Gestão da Equipe)

Sua corporação (Líderes) necessita de logins autorizados para editar eventos em tempo real, criados em nuvem pelos Administradores da respectiva casa.

**📝 Como habilitar o acesso:**
1. Abaixo de **Configurações** ⚙️, localize a região dedicada de **"Gerenciar Acessos e Líderes"**.
2. Preencha o **Nome**, credencie um **e-mail de acesso personalizado** (O sistema embutirá o endereço oficial `@slug.com`) e escolha a senha da nova conta provendo-lhe os acessos.
3. No campo chave **Departamento**, decida o nível tático da pessoa:
   - ⚠️ **Importante (Delegação Global):** Ao criar o membro e delegá-lo como *"Acesso Global (Sem Restrição)"*, este login será automaticamente elevado à patente de **Ancião**, herdando controle perene e geral das abas e acessos da igreja!
   - 🔒 Ao travá-lo setando nele um *Departamento listado*, a pessoa obterá a governança moderada de **Líder**, apenas editando sobre esferas que lhe circundam.

> 💡 Há também a caixa secundária dos *"Membros Voluntários"*, onde uma liderança armazena nominais das pessoas (coral, equipe de trânsito) só para tê-las no banco e engatá-las nas listas de escala mais facilmente a frente, ou seja, são pessoas que colaboram mas **não acessam o portal de edição.**

---

## 🎨 3. Gestão Completa de Departamentos (Grupos)

Toda engrenagem centraliza numa tribo. Departamentos representam seus ministérios consolidados (Recepção, Desbravadores, Diaconato, etc). Todo evento oficial provém encabeçado e sustentado por alguém.

**📋 Funcionalidades de Gerenciamento Setorial:**
- **Atrelagem de Identidade Visual:** Recebendo customizações profundas, o usuário elege uma **Cor de Identificação** padrão da organização. Essa cor síncrona acenderá imediatamente as pulseiras (tags/etiquetas) ao redor de 100% que represente aquela área no painel principal, ajudando os leitores a interpretarem eventos rápidos com os olhos.
- **Upload de Identidades de Nicho:** É feito suporte total da injeção autônoma do banco de arquivos pra as Logomarcas isoladas, caracterizando individualmente seus ministérios na tela geral de edições e equipes da base.

---

## 📅 4. Calendários Oficializados (O Core Tático)

Central do **7 Flow**: Coordenar cronogramas dinâmicos da semana sem medo dos ruídos e engarrafamentos temporais de planilhas. Só a hierarquia da equipe escala os registros.

### 4.1. Construção Inteligente e Restrições de Agenda
- No módulo Grid Mensal flutuante do portal nativo, o dia alvo emite modal limpo **+ Novo Evento**.
- **Delimitação Cronológica:** Prazos rígidos cobram preenchimentos para engessar os painéis nos dias das execuções (Evita horários conflitantes de dois eventos paralelos em uma igreja). Trata de um modelo Server-Side validado.
- **Multitasking Colaborativo:** Deseja levantar um Retiro que englobe o Apoio de Segurança e Logística? Para eventos plurais, o organizador mestre pode chamar em clique múltiplos *Departamentos Colaboradores*. Assim, em suas contas paralelas dentro de suas casas, os Diretores acionados terão destravadas na tela interna do Card Evento a janela de "Escala de Covidados" pro Retiro.
- **Mídia Integrada de Banner:** Arquivos sobressaem convertidos, compactados instantaneamente direto pro nuvem da plataforma. Imagens ricas sobem à tela frontal gerando "Premium Cards" na face nativa do público Visitante.

### 4.2. Clone Automatizado em Lote (Recorrências Contínuas) 🔁
Planejar o evento fixo de 2 anos todo domingo à noite? Não exija esforço diário.
- Marcando-se de forma enxuta `"Repetir Semanalmente"`...
- O algoritmo vai preencher todo o banco do ano copiando horários idênticos da grade nas próximas **26 semanas consecutivas (Exatos 6 meses em 1 único clique)**.

### 4.3. Sistema Cascata Editável 🌊
- Edições contínuas pro culto não assustam:
No backend das "edições avulsas", se um horário oficial do culto de domingo é revisado, o usuário acopla com o seletor pedindo: `"Somente pro culto desse dia"` VS `"Pra este momento e repise a regra para todos os clones futuros gerados a frente na série"`. Sem contaminar a estatística local!

---

## 📜 5. A Engenharia Pura: Doxologias e Convidados (Scales)

### 5.1 Sistema Mestre dos Templates p/ Liturgia
Dentro da "Engrenagem Global de Configuração" Anciãos modelam cronogramas duros fixados p/ base de dados. Um modelo salvo ali de *"Ação de Graças Base"* constará já pronto em instantes na hora criar do zero um layout de evento com aqueles mesmos trechos e canções agendados, dispensando fadiga de digitações!

### 5.2. Editor Validado e Seguro (Doxologias Reativas)
A máquina de gerenciamento constrói perfeitamente o tempo.
- Ela exige segurança matemática para *Bound check (Bordas de Data e Hora)*: É explicitamente **impedido o salvamento** se por acaso um dos gestores cadastrar uma dinâmica de tempo que escapa pra um horário que ultrapasse a moldura oficial do começo ou fim do dia do templo!
- **Ajuste Espacial Dinâmico:** Os *inputs reativos* sobem e descem (Sort). A matriz lê números, não cordões, de modo que *a alocação organiza o culto verticalmente enquanto se digita na interface React*, incluindo uma análise noturna onde momentos "01:45" saltam perfeitamente pós fechamentos tardios da cronologia meia-noite pra listagem final sem embolar horas matutinas da manhã de vigílias.

### 5.3. Escalada Tagmada do Staff Local
O construtor do "Staff":
- Durante a *Módulo de Seleção*, ao subir "João" à tela daquele evento, o Back-End empunha a quem convocou o tag e etiqueta sua área de quem a operou (Recepção), alinhando e selando o rapaz nas caixas divisórias e emissores específicos listando as operações!

---

## 📱 6. Smart Portal Visitante (Telas Livres & Quiosques Redes)

Uma UI/UX pública focada central nas congregações no path (` /slug-padrao-da-igreja `), com logotipo autoral de portal próprio para visualização e consulta externa rápida por celulares da nave de culto.

- **Filtragens Responsivas:** O Congregado é livre no App via Switch lateral isolatório, ligando ou "escondendo" chaves coloridas por departamentos a gosto visual p/ consumir e varrer o mês enxergando nada a não ser eventos estritamente do Trânsito ou de sua célula local no prédio.
- **Privacy Design Interno (Hide Mod):** Operações e burocracias das equipes do evento sofrem forte restrição visual Front/Back end da Tela principal. Um congregante recebe os horários do painel local, data, cartaz virtual limpo... **Sem a capacidade intrusiva de xeretar escalas internas corporativas restritas, ou acompanhar alocações doxológicas sem uma sessão viva do token Administrativo Liderança.**
- **Monitor Passivo da Apresentação (Slideshow TV):** Um software silencioso, feito exclusivo para a TV smart / Lobby eletrônico acende quando as recepções ficam com controle remoto congelado. Dispara imediatamente a varredura e rota interativa Carousel focado horizontal e dinâmico p/ telas imersivas do hall de portões comunicacionais. O Idle Time vira mídia digital programada. Em resumo: Uma super ferramenta pra qualquer culto do Século 21!
