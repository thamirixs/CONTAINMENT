"use strict";

/* =========================================================
   CONTAINMENT — NARRATIVA AMPLIADA
   Compatível com o HTML e o CSS enviados anteriormente.
   ========================================================= */

const $ = id => document.getElementById(id);

const KEY = "containment-save-v2";
const LEGACY_KEY = "containment-save-v1";

const value = input =>
  typeof input === "function" ? input() : input;

const ITEMS = {
  radio: "Rádio de emergência",
  dosimeter: "Dosímetro",
  suit: "Roupa de proteção",
  kit: "Kit de primeiros socorros",
  archive: "Cópia autenticada dos registros"
};

const SECTORS = {
  control: "Sala de controle",
  locker: "Vestiário de emergência",
  archive: "Arquivo técnico",
  pumps: "Galeria de bombas",
  aid: "Posto de atendimento",
  relay: "Central de comunicação"
};

const fresh = () => ({
  version: 2,
  node: "alarm",
  minutes: 0,
  health: 100,
  dose: 0,
  contamination: 0,
  items: [],
  evidence: [],
  visited: [],
  flags: {},
  history: [],
  alerts: [],
  last: "",
  ending: null
});

let state = fresh();
let noticeTimer;

const has = item => state.items.includes(item);

const flag = name => Boolean(state.flags[name]);

const add = item => {
  if (!has(item)) {
    state.items.push(item);
  }
};

const clue = text => {
  if (!state.evidence.includes(text)) {
    state.evidence.push(text);
  }
};

const clock = minutes => {
  const total = 222 + minutes;

  return (
    String(Math.floor(total / 60)).padStart(2, "0") +
    ":" +
    String(total % 60).padStart(2, "0")
  );
};

const alertEvent = text => {
  state.alerts.push({
    time: clock(state.minutes),
    text
  });
};

/*
  t = duração da ação.
  r = intensidade fictícia de exposição por minuto.
  c = contato externo com material radioativo.
  h = ferimento industrial ou cuidado de ferimento.

  Os valores são mecânicas fictícias.
  Dose não reduz integridade automaticamente.
*/

const choice = (text, to, t, result, extra = {}) => ({
  text,
  to,
  t,
  result,
  ...extra
});

const scene = (
  chapter,
  location,
  title,
  text,
  choices
) => ({
  chapter,
  location,
  title,
  text,
  choices
});

/* =========================================================
   CENAS PRINCIPAIS
   ========================================================= */

const SCENES = {
  alarm: scene(
    1,
    "Sala de controle",
    "03:42 — A interrupção",

    "Sua caneca bate na borda do painel antes de você ouvir o " +
    "estrondo. As lâmpadas apagam. Quando a iluminação vermelha " +
    "acende, a cadeira de Lia está vazia. No encosto, o casaco " +
    "que ela sempre esquece." +
    "\n\n" +
    "O painel confirma: desligamento automático do reator. " +
    "Um arco elétrico rompeu um quadro no setor de serviço. " +
    "Não houve detonação nuclear, mas o calor residual continua " +
    "exigindo refrigeração." +
    "\n\n" +
    "Você é Alex, operador de apoio. Há uma mensagem de Lia, " +
    "enviada às 03:31, ainda não ouvida. Um novo alarme ocupa " +
    "a tela: alimentação auxiliar sem confirmação.",

    [
      choice(
        "Conferir os alarmes no posto protegido",
        "brief",
        3,

        "Você confirma o desligamento e a perda de alimentação. " +
        "São fatos que a equipe técnica poderá usar.",

        {
          run: () => {
            state.flags.checked = true;

            clue(
              "03:42: desligamento automático confirmado; " +
              "alimentação auxiliar indisponível."
            );
          }
        }
      ),

      choice(
        "Ir ao corredor procurar Lia",
        "corridor",
        2,

        "Você chama Lia duas vezes. Na segunda, uma batida " +
        "responde atrás da porta de serviço.",

        {
          r: 1,
          c: 5
        }
      )
    ]
  ),

  corridor: scene(
    1,
    "Corredor de serviço",
    "Uma voz atrás da porta",

    "Lia responde pelo interfone local: está presa do outro lado " +
    "de uma porta deformada. Há cabos caídos e vapor; entrar " +
    "sozinho não é um resgate controlado.",

    [
      choice(
        "Marcar a localização e chamar resgate pelo interfone",
        "brief",
        3,

        "A equipe recebe a localização exata de Lia.",

        {
          run: () => {
            state.flags.liaLocated = true;
          }
        }
      ),

      choice(
        "Puxar a porta antes de recuar",
        "brief",
        5,

        "Uma chapa corta seu braço. Você não consegue abrir " +
        "a porta, mas confirma a localização para o resgate.",

        {
          h: -20,
          r: 2,
          c: 10,

          run: () => {
            state.flags.liaLocated = true;
          }
        }
      )
    ]
  ),

  brief: scene(
    1,
    "Posto protegido",
    "Quem ainda está ouvindo?",

    () =>
      "Helena atende no terminal fixo. Você conhece aquela voz " +
      "há seis anos. Ela só fala tão devagar quando está tentando " +
      "não perder uma informação. “Alex. Primeiro, sua posição. " +
      "Depois, apenas o que você confirmou.”" +
      "\n\n" +
      "O incêndio afetou alimentação e instrumentação. Uma linha " +
      "auxiliar em manutenção não retornou ao serviço. " +
      (
        flag("liaLocated")
          ? "Você tem a posição de Lia, mas ainda não há " +
            "confirmação de retirada."
          : "Lia continua sem responder ao canal geral."
      ) +
      "\n\n" +
      "Helena pergunta se a equipe de apoio deve ser enviada " +
      "ao seu setor.",

    [
      choice(
        "Informar posição, incertezas e ausência de Lia",
        "gear",
        2,

        "Helena repete sua posição para confirmar. " +
        "“Equipe de apoio a caminho. Não entre na galeria.”",

        {
          run: () => {
            state.flags.contact = true;
          }
        }
      ),

      choice(
        "Minimizar: provavelmente é apenas um alarme falso",
        "gear",
        1,

        "“Entendido. Vou priorizar o setor que confirmou danos.” " +
        "Você ouve Helena mudar de canal. Sua avaliação passou " +
        "a orientar a distribuição de apoio.",

        {
          run: () => {
            state.flags.minimized = true;
          }
        }
      )
    ]
  ),

  gear: scene(
    1,
    "Armário do posto",
    "O que você leva",

    "O armário contém rádio, dosímetro e roupa de proteção " +
    "contra contaminação superficial. Nenhum desses objetos " +
    "autoriza entrar em área interditada. A roupa não é " +
    "blindagem contra radiação penetrante.",

    [
      choice(
        "Conferir e levar os três equipamentos",
        "echo",
        4,

        "Rádio testado, dosímetro ativo e proteção vestida.",

        {
          run: () => {
            add("radio");
            add("dosimeter");
            add("suit");
          }
        }
      ),

      choice(
        "Levar somente rádio e dosímetro",
        "echo",
        2,

        "Você mantém comunicação e monitoramento; contato " +
        "com material contaminado continua possível.",

        {
          run: () => {
            add("radio");
            add("dosimeter");
          }
        }
      ),

      choice(
        "Sair imediatamente sem equipamento",
        "echo",
        1,

        "Sem instrumentos, o indicador radiológico da interface " +
        "será apenas estimativa narrativa."
      )
    ]
  ),

  route: scene(
    2,
    "Acesso à zona administrativa",
    "Dois caminhos",

    "Helena orienta o deslocamento para o abrigo interno B. " +
    "A rota sinalizada tem barreiras físicas; o atalho cruza " +
    "uma galeria danificada. O relógio avança somente quando " +
    "você age.",

    [
      choice(
        "Seguir a rota sinalizada até o abrigo",
        "arrival",
        4,

        "Você chega ao abrigo B sem cruzar a galeria.",

        {
          r: 0.25
        }
      ),

      choice(
        "Usar o atalho pela galeria",
        "arrival",
        2,

        "Você escorrega entre destroços e atravessa uma área " +
        "com material depositado.",

        {
          h: -15,
          r: 3,
          c: 18
        }
      )
    ]
  ),

  hub: scene(
    2,
    "Abrigo B / distribuição",
    "O mapa incompleto",

    () =>
      "O abrigo tem telefone fixo e portas isoladas. Você pode " +
      "visitar cada setor uma vez antes de seguir à coordenação. " +
      "Investigar custa tempo; abandonar pistas também tem " +
      "consequências." +
      "\n\n" +
      `${state.visited.length} de 6 setores visitados. ` +
      `Restam ${Math.max(0, 70 - state.minutes)} minutos ` +
      "da janela narrativa de deslocamento.",

    []
  ),

  control: scene(
    2,
    "Sala de controle secundária",
    "Um quadro contraditório",

    "A tela indica uma bomba disponível, mas a corrente elétrica " +
    "é zero. A engenheira de plantão pede confirmação documental, " +
    "sem manobra local. Uma indicação isolada pode estar errada.",

    [
      choice(
        "Cruzar registros e informar a divergência",
        "hub",
        4,

        "A equipe identifica a indicação enganosa e ajusta " +
        "sua avaliação.",

        {
          run: () => {
            state.flags.checked = true;

            clue(
              "A indicação de bomba disponível contradizia " +
              "a corrente nula."
            );
          }
        }
      ),

      choice(
        "Copiar apenas a tela de disponibilidade",
        "hub",
        1,

        "Seu registro é rápido, mas preserva a ambiguidade.",

        {
          run: () => {
            state.flags.superficial = true;
          }
        }
      )
    ]
  ),

  locker: scene(
    2,
    "Vestiário de emergência",
    "Uma segunda oportunidade",

    "Um armário lacrado guarda suprimentos. Você também encontra " +
    "um kit para ferimentos leves; ele não trata exposição nem " +
    "permite ignorar uma lesão grave.",

    [
      choice(
        "Repor equipamentos e recolher o kit",
        "hub",
        3,

        "Você completa o equipamento disponível.",

        {
          run: () => {
            add("radio");
            add("dosimeter");
            add("suit");
            add("kit");
          }
        }
      ),

      choice(
        "Recolher apenas o kit",
        "hub",
        1,

        "O kit fica disponível no inventário; usá-lo consumirá " +
        "dois minutos.",

        {
          run: () => {
            add("kit");
          }
        }
      )
    ]
  ),

  archive: scene(
    2,
    "Arquivo técnico",
    "A página que falta",

    () =>
      "O terminal abre uma ordem de manutenção das 02:16: falha " +
      "intermitente no atuador da linha auxiliar. A página " +
      "seguinte mostra o checklist de retorno, com sua assinatura " +
      "e um campo de verificação independente em branco." +
      "\n\n" +
      (
        flag("voicemail")
          ? "A frase da mensagem de Lia volta à sua cabeça: " +
            "“Não considera liberado ainda.” Os horários não " +
            "combinam com o que você lembra ter confirmado."
          : "Você lembra de ter recebido uma confirmação verbal. " +
            "Não consegue lembrar de quem."
      ) +
      "\n\n" +
      "Há uma cópia central de auditoria. Apagar a anotação " +
      "local não garante apagar seu rastro.",

    [
      choice(
        "Preservar os documentos completos, inclusive sua assinatura",
        "hub",
        4,

        "Você copia a sequência inteira. Agora há evidência " +
        "documental, mas será preciso explicar a assinatura.",

        {
          run: () => {
            add("archive");

            clue(
              "02:16: manutenção pendente; checklist posterior " +
              "assinado sem segunda verificação."
            );

            state.flags.proof = true;
          }
        }
      ),

      choice(
        "Apagar sua anotação da cópia local",
        "hub",
        2,

        "A linha desaparece. Um aviso permanece: alteração " +
        "registrada na auditoria. Você fecha a janela antes " +
        "de terminar de lê-lo.",

        {
          run: () => {
            state.flags.tampered = true;
          }
        }
      )
    ]
  ),

  pumps: scene(
    2,
    "Limite da galeria de bombas",
    "Atrás da faixa amarela",

    () =>
      "Lia responde do compartimento lateral: “Não abre essa " +
      "porta. Tem uma chapa apoiada nela.” Pela primeira vez, " +
      "você percebe que ela não está pedindo que você entre. " +
      "Está pedindo que alguém saiba onde ela está." +
      "\n\n" +
      (
        flag("teamLate")
          ? "A equipe de apoio ainda está se deslocando de outro " +
            "setor. Sua mensagem inicial contribuiu para essa demora."
          : "A equipe está próxima. A informação que você " +
            "transmitiu no início permitiu organizar o apoio."
      ) +
      " Um visor permite indicar uma passagem de serviço " +
      "para os profissionais.",

    [
      choice(
        "Passar a referência e aguardar o resgate na barreira",
        "testimony",

        () => flag("teamLate") ? 6 : 3,

        () =>
          flag("teamLate")
            ? "A equipe chega após a espera e retira Lia. " +
              "O atraso consumiu parte da sua janela de investigação."
            : "A equipe já posicionada retira Lia pela passagem " +
              "de serviço. Ela segura seu braço ao passar.",

        {
          r: 0.5,

          run: () => {
            state.flags.liaSaved = true;
            state.flags.liaLocated = true;
            state.flags.liaHub = true;
          }
        }
      ),

      choice(
        "Entrar sozinho, apesar do aviso de Lia",
        "testimony",

        () => flag("teamLate") ? 8 : 5,

        "Uma chapa cai e fere sua perna. A equipe precisa " +
        "retirar vocês dois. Lia repete: “Eu disse para não abrir.”",

        {
          h: -40,
          r: 4,
          c: 25,

          run: () => {
            state.flags.liaSaved = true;
            state.flags.liaLocated = true;
            state.flags.reckless = true;
            state.flags.liaHub = true;
          }
        }
      ),

      choice(
        "Transmitir a posição e seguir sem aguardar",
        "hub",
        1,

        "A central registra o compartimento. A informação " +
        "permitirá uma busca mais rápida, mas a retirada " +
        "ainda não foi confirmada.",

        {
          run: () => {
            state.flags.liaLocated = true;
          }
        }
      )
    ]
  ),

  aid: scene(
    2,
    "Posto de atendimento",
    "Ferimento não é dose",

    "A equipe separa avaliação de trauma, monitoramento " +
    "radiológico e descontaminação. Você pode estar exposto " +
    "sem estar contaminado; sentir-se bem não descarta exposição.",

    [
      choice(
        "Receber avaliação e descontaminação assistida",
        "hub",
        5,

        "Ferimentos leves são cuidados e a contaminação externa " +
        "diminui. A dose recebida permanece.",

        {
          h: 15,

          run: () => {
            state.contamination = Math.max(
              0,
              state.contamination - 35
            );

            state.flags.assessed = true;
          }
        }
      ),

      choice(
        "Pegar um kit e adiar a avaliação",
        "hub",
        1,

        "Você leva material para cuidados leves, sem avaliação " +
        "radiológica.",

        {
          run: () => {
            add("kit");
          }
        }
      )
    ]
  ),

  relay: scene(
    2,
    "Central de comunicação",
    "O aviso para fora",

    "O enlace fixo funciona. A equipe de emergência precisa " +
    "de dados confiáveis para acionar autoridades competentes " +
    "e avaliar medidas de proteção fora da instalação. Ainda " +
    "não há confirmação da extensão de uma liberação.",

    [
      choice(
        "Transmitir fatos, horários e incertezas",
        "hub",
        4,

        "A coordenação recebe um relato rastreável e inicia " +
        "a comunicação externa prevista no plano.",

        {
          run: () => {
            state.flags.external = true;

            clue(
              "Comunicação formal registra risco de liberação, " +
              "sem inventar medições."
            );
          }
        }
      ),

      choice(
        "Repetir a nota de que não há qualquer risco",
        "hub",
        1,

        "A nota tranquiliza sem evidência suficiente e poderá " +
        "atrasar a resposta.",

        {
          run: () => {
            state.flags.falseReassurance = true;
          }
        }
      )
    ]
  ),

  responsibility: scene(
    3,
    "Coordenação de emergência",
    "A pergunta de Helena",

    () =>
      "Helena deixa uma cópia do checklist sobre a mesa. Não " +
      "aponta sua assinatura. Aponta o espaço vazio ao lado " +
      "dela. “Quem fez a verificação independente?”" +
      "\n\n" +
      "Você finalmente reconstrói o fim do turno anterior: " +
      "havia pressa para devolver a linha ao serviço. Você " +
      "assinou confiando em uma confirmação verbal, sem " +
      "conferir o retorno. " +
      (
        flag("voicemail")
          ? "Lia tentou avisar às 03:31. Você tem a mensagem " +
            "que comprova isso."
          : "A mensagem de Lia continuou esperando enquanto " +
            "você tratava o assunto como encerrado."
      ) +
      "\n\n" +
      (
        flag("testimony")
          ? "O depoimento de Lia também mostra pressão para " +
            "encerrar a manutenção. Sua falha faz parte de " +
            "uma cadeia; não é a única."
          : "Helena diz que a falha do checklist não explica " +
            "sozinha o incêndio nem a perda de refrigeração. " +
            "Ainda assim, pode ter dificultado a resposta."
      ) +
      "\n\n" +
      "“Eu preciso saber em que informação posso confiar " +
      "agora, Alex.”",

    [
      choice(
        "Assumir que assinou sem a verificação independente",

        () => flag("tampered")
          ? "confrontation"
          : "plan",

        3,

        "Você explica a omissão. Helena registra suas palavras. " +
        "“Isso ajuda a equipe. Não encerra a investigação.”",

        {
          run: () => {
            state.flags.honest = true;
          }
        }
      ),

      choice(
        "Afirmar que conferiu tudo pessoalmente",
        "confrontation",
        1,

        "Helena não responde imediatamente. Ela abre a trilha " +
        "de auditoria ao lado do seu depoimento.",

        {
          run: () => {
            state.flags.lied = true;
          }
        }
      )
    ]
  ),

  plan: scene(
    3,
    "Coordenação de emergência",
    "Uma linha que não responde",

    () =>
      "A equipe técnica avalia um circuito alternativo de " +
      "remoção de calor. Sua tarefa é fornecer evidências; " +
      "você não tem autorização para operar equipamentos " +
      "localmente." +
      "\n\n" +
      (
        flag("testimony")
          ? "O relato de Lia identifica o teste de retorno " +
            "que faltou. A equipe poderá localizar os " +
            "registros relevantes mais depressa."
          : "Sem o relato da manutenção, a equipe precisa " +
            "reconstruir a sequência a partir dos registros " +
            "disponíveis."
      ) +
      "\n\n" +
      (
        needsReview()
          ? "Helena informa que suas conclusões serão " +
            "conferidas por outro operador. As inconsistências " +
            "anteriores custam três minutos adicionais de validação."
          : "Helena aceita seu relato como informação de " +
            "trabalho, sem dispensar a validação técnica."
      ),

    [
      choice(
        "Entregar evidências para a equipe validar a alternativa",
        "dispatch",

        () =>
          (flag("testimony") ? 2 : 4) +
          (needsReview() ? 3 : 0),

        () =>
          "A equipe valida o circuito alternativo e estabiliza " +
          "a remoção de calor. " +
          (
            flag("testimony")
              ? "A pista de Lia reduziu a busca nos registros. "
              : ""
          ) +
          (
            needsReview()
              ? "A revisão independente exigiu tempo adicional. "
              : ""
          ) +
          "O incêndio e a contaminação local ainda exigem resposta.",

        {
          need: () =>
            flag("checked") ||
            flag("honest") ||
            flag("proof") ||
            flag("testimony"),

          why:
            "Exige alarmes conferidos, omissão assumida, " +
            "documentos ou depoimento de Lia.",

          run: () => {
            state.flags.stable = true;
            state.flags.evidencePlan = true;

            if (needsReview()) {
              state.flags.reviewApplied = true;
            }
          }
        }
      ),

      choice(
        "Solicitar avaliação conservadora com os dados disponíveis",
        "dispatch",

        () => 5 + (needsReview() ? 3 : 0),

        "A equipe mantém o isolamento e as ações de proteção. " +
        "Não consegue confirmar estabilidade nesta janela.",

        {
          run: () => {
            state.flags.conservative = true;

            if (needsReview()) {
              state.flags.reviewApplied = true;
            }
          }
        }
      ),

      choice(
        "Garantir, sem evidência, que a linha original está pronta",
        "validation",
        1,

        "Helena encaminha sua afirmação. A engenheira responde: " +
        "“A corrente continua nula. Essa linha não está disponível.”",

        {
          run: () => {
            state.flags.badAdvice = true;
          }
        }
      )
    ]
  ),

  dispatch: scene(
    3,
    "Canal de emergência",
    "A mensagem interrompida",

    () => {
      if (flag("liaSaved")) {
        return (
          "A central confirma Lia no posto de atendimento. " +
          (
            flag("testimony")
              ? "Seu depoimento já integra os dados da ocorrência."
              : flag("pressured")
                ? "Ela pediu para falar diretamente com Helena " +
                  "depois da sua tentativa de silenciá-la."
                : "Você passou adiante antes de registrar " +
                  "o que ela sabia."
          ) +
          "\n\n" +
          "Helena pede que você confirme a contagem de pessoal " +
          "antes de fechar seu relatório."
        );
      }

      return (
        "O nome de Lia ainda aparece sem baixa na contagem. " +
        (
          flag("liaLocated")
            ? "Você já transmitiu o compartimento em que ela " +
              "estava; a equipe pode ir direto ao ponto."
            : "Sem uma posição confirmada, a equipe precisará " +
              "verificar dois compartimentos."
        ) +
        "\n\n" +
        (
          flag("teamLate")
            ? "O atraso inicial também deixou o apoio mais distante."
            : "Há uma equipe disponível para receber a atualização."
        )
      );
    },

    [
      choice(
        "Confirmar a situação pelo rádio",

        () => flag("liaSaved")
          ? "record"
          : "rescueSearch",

        1,

        () =>
          flag("liaSaved")
            ? "Você confirma Lia no posto. A central atualiza " +
              "a contagem."
            : "A central abre a ficha de busca. A retirada " +
              "ainda precisa acontecer.",

        {
          need: () => has("radio"),
          why: "Exige rádio no inventário."
        }
      ),

      choice(
        "Usar o telefone fixo",

        () => flag("liaSaved")
          ? "record"
          : "rescueSearch",

        3,

        () =>
          flag("liaSaved")
            ? "O posto confirma a presença de Lia."
            : "A ligação chega à brigada. Você pode acompanhar " +
              "a busca à distância."
      ),

      choice(
        "Prosseguir sem atualizar a contagem",
        "record",
        1,

        "Você fecha o canal. O relatório vai carregar apenas " +
        "o que já foi confirmado."
      )
    ]
  ),

  record: scene(
    3,
    "Terminal de ocorrências",
    "Um registro permanente",

    () =>
      "A gerência pede um relatório enxuto: “Incêndio elétrico, " +
      "falha de alimentação, resposta em andamento.” A frase " +
      "é verdadeira, mas incompleta." +
      "\n\n" +
      (
        flag("testimony")
          ? "Você tem o relato de Lia sobre a manutenção e " +
            "a pressão para encerrar o serviço. "
          : ""
      ) +
      (
        flag("tampered")
          ? "A auditoria também registra sua alteração " +
            "no terminal. "
          : ""
      ) +
      (
        flag("retracted")
          ? "Sua retratação pode ser anexada, mas não apaga " +
            "a primeira versão. "
          : ""
      ) +
      "O relatório pode preservar essas informações ou deixar " +
      "para outra pessoa descobri-las.",

    [
      choice(
        "Registrar fatos, contradições e documentos originais",
        "warning",
        3,

        "O registro inclui sua omissão e as evidências disponíveis. " +
        "Versões anteriores permanecem na trilha de auditoria.",

        {
          run: () => {
            state.flags.report = true;

            if (flag("proof")) {
              state.flags.submitted = true;
            }
          }
        }
      ),

      choice(
        "Omitir o checklist e atribuir tudo ao incêndio",
        "warning",
        1,

        "Você envia um relato incompleto. Quem depender dele " +
        "não terá os mesmos elementos que você.",

        {
          run: () => {
            state.flags.coverup = true;
          }
        }
      )
    ]
  ),

  warning: scene(
    4,
    "Abrigo B",
    "Do lado de fora dos muros",

    () =>
      (
        flag("stable")
          ? "A remoção de calor foi estabilizada; a avaliação " +
            "ambiental continua."
          : "A estabilidade ainda não foi confirmada; " +
            "o comando amplia medidas preventivas."
      ) +
      " Uma operadora pergunta qual versão deve constar na " +
      "atualização às autoridades." +
      "\n\n" +
      (
        flag("falseReassurance")
          ? "Ela lê uma frase que você transmitiu antes: " +
            "“Não há qualquer risco.” Agora é preciso decidir " +
            "o que fazer com essa garantia sem fundamento."
          : flag("external")
            ? "O aviso anterior já permitiu organizar a " +
              "recepção dos trabalhadores. Falta a atualização."
            : "Seu setor ainda não enviou uma comunicação " +
              "externa confirmada. O comando precisa dos " +
              "fatos, inclusive das incertezas."
      ),

    [
      choice(
        "Encaminhar fatos e corrigir garantias anteriores",

        () => flag("falseReassurance")
          ? "communication"
          : "decon",

        3,

        () =>
          flag("falseReassurance")
            ? "Você envia uma correção explícita. A equipe " +
              "terá de confirmar que os destinatários " +
              "receberam a nova versão."
            : "O comando recebe a atualização factual e " +
              "coordena as medidas de proteção.",

        {
          run: () => {
            state.flags.external = true;

            if (flag("falseReassurance")) {
              state.flags.correctedPublic = true;
            }
          }
        }
      ),

      choice(
        "Pedir que o aviso seja adiado para proteger a empresa",
        "communication",
        1,

        "Seu pedido chega à coordenação. A operadora mantém " +
        "a janela aberta, esperando uma decisão formal.",

        {
          run: () => {
            state.flags.delayed = true;
          }
        }
      )
    ]
  ),

  decon: scene(
    4,
    "Controle de saída",
    "O que você leva consigo",

    "A equipe instalou monitoramento na saída. A descontaminação " +
    "é assistida, com controle de resíduos e nova avaliação. " +
    "Ela pode remover material externo; não reverte a radiação " +
    "já recebida.",

    [
      choice(
        "Passar por monitoramento e descontaminação",
        "exit",
        5,

        "O material externo é reduzido e sua condição é " +
        "registrada para acompanhamento.",

        {
          run: () => {
            state.contamination = Math.max(
              0,
              state.contamination - 50
            );

            state.flags.assessed = true;
            state.flags.decon = true;
          }
        }
      ),

      choice(
        "Declarar possível contaminação e pedir transporte segregado",
        "exit",
        2,

        "A equipe organiza transporte separado e mantém sua " +
        "avaliação pendente.",

        {
          run: () => {
            state.flags.segregated = true;
          }
        }
      ),

      choice(
        "Tentar sair sem informar a contaminação",
        "exit",
        1,

        "Você evita o controle e pode transportar material " +
        "para áreas limpas.",

        {
          run: () => {
            state.flags.spread = state.contamination > 0;
          }
        }
      )
    ]
  ),

  exit: scene(
    4,
    "Ponto de reunião interno",
    "A última porta",

    "O transporte coordenado está prestes a sair. A rota externa " +
    "foi avaliada pela equipe. Um túnel de manutenção parece " +
    "mais curto, mas há aviso de colapso estrutural. Você também " +
    "pode permanecer no abrigo e aguardar outra equipe.",

    [
      choice(
        "Seguir com a evacuação coordenada",
        "finish",

        () => flag("communicationPending") ? 7 : 4,

        () =>
          flag("communicationPending")
            ? "A recepção precisa de três minutos adicionais " +
              "para conferir a atualização pendente. Você " +
              "finalmente dá baixa no ponto de reunião."
            : "Você entrega sua identificação no ponto de " +
              "reunião. A madrugada termina; a investigação começa.",

        {
          run: () => {
            state.flags.evacuated = true;
          }
        }
      ),

      choice(
        "Permanecer no abrigo e aguardar resgate",
        "finish",
        6,

        "Você informa sua posição e aguarda retirada assistida.",

        {
          run: () => {
            state.flags.rescued = true;
          }
        }
      ),

      choice(
        "Fugir sozinho pelo acesso externo de serviço",
        "finish",
        2,

        "Você deixa o perímetro sem dar baixa no controle " +
        "de pessoal.",

        {
          r: 3,
          c: 10,

          run: () => {
            state.flags.abandoned = true;
          }
        }
      ),

      choice(
        "Entrar no túnel com risco de colapso",
        "finish",
        3,

        "A estrutura cede. A equipe encontra sua identificação " +
        "entre os destroços.",

        {
          h: -100
        }
      )
    ]
  )
};

/* =========================================================
   CONFIANÇA E CONFERÊNCIA ADICIONAL
   ========================================================= */

const needsReview = () =>
  (flag("lied") && !flag("retracted")) ||
  (flag("tampered") && !flag("confessedTampering")) ||
  flag("superficial");

/* =========================================================
   CENAS CONDICIONAIS DA NARRATIVA AMPLIADA
   ========================================================= */

Object.assign(SCENES, {
  echo: scene(
    1,
    "Terminal do posto",
    "03:31 — Onze minutos antes",

    "A mensagem de Lia sobreviveu à falha de energia. Dura " +
    "doze segundos. Ao fundo, alguém pede que ela encerre " +
    "uma ordem de serviço. Você lembra de ter visto a " +
    "notificação e pensado: depois eu ouço." +
    "\n\n" +
    "O terminal permite ouvir e preservar o áudio antes de sair.",

    [
      choice(
        "Ouvir e preservar a mensagem",
        "route",
        2,

        "“Alex, não considera liberado ainda. Falta o teste " +
        "de retorno. Eu vou verificar a galeria.” A gravação " +
        "termina com um ruído de porta.",

        {
          run: () => {
            state.flags.voicemail = true;

            clue(
              "03:31: Lia alertou que o teste de retorno " +
              "da linha auxiliar ainda faltava."
            );
          }
        }
      ),

      choice(
        "Deixar a mensagem para depois",
        "route",
        0,

        "Você fecha a notificação. A frase que Lia tentou " +
        "dizer permanece desconhecida; a equipe continuará " +
        "sem essa pista."
      )
    ]
  ),

  arrival: scene(
    2,
    "Entrada do abrigo B",
    "O lugar vazio",

    () => {
      if (flag("minimized")) {
        return (
          "Há uma maca encostada na parede e ninguém ao lado " +
          "dela. O apoio foi deslocado para o setor que " +
          "confirmou danos. Helena repete sua mensagem: " +
          "“Você disse que provavelmente era alarme falso.”" +
          "\n\n" +
          "Pela primeira vez, uma frase sua volta como uma " +
          "decisão que outra pessoa tomou. Você pode corrigi-la " +
          "ou aguardar a redistribuição da equipe."
        );
      }

      return (
        "Um brigadista confere seu nome na entrada. " +
        "“Recebemos sua posição. O apoio já foi acionado.” " +
        "No quadro, há um espaço sem marcação ao lado " +
        "do nome de Lia." +
        "\n\n" +
        "Helena pede que você mantenha a comunicação e " +
        "procure documentos apenas nos setores liberados."
      );
    },

    [
      choice(
        "Corrigir a avaliação inicial e informar a urgência",
        "hub",
        3,

        "Helena redireciona o apoio. “Obrigada por corrigir. " +
        "O tempo perdido não volta.” Sua retratação fica " +
        "junto da mensagem original.",

        {
          need: () => flag("minimized"),

          why: "Sua avaliação inicial já foi factual.",

          run: () => {
            state.flags.correctedBrief = true;
            state.flags.teamLate = true;

            alertEvent(
              "Apoio redirecionado após correção do relato " +
              "inicial; chegada atrasada."
            );
          }
        }
      ),

      choice(
        "Manter a versão e aguardar a redistribuição",
        "hub",
        6,

        "A brigada precisa confirmar os danos por outro canal " +
        "antes de redirecionar o apoio. Você espera seis minutos.",

        {
          need: () => flag("minimized"),

          why: "Não há relato inicial minimizado a manter.",

          run: () => {
            state.flags.teamLate = true;
            state.flags.maintainedBrief = true;

            alertEvent(
              "Danos confirmados por outra equipe. " +
              "Apoio em deslocamento tardio."
            );
          }
        }
      ),

      choice(
        "Receber a orientação e entrar no abrigo",
        "hub",
        1,

        "A equipe conhece sua posição e já organizou o apoio. " +
        "Você pode escolher os setores a visitar.",

        {
          need: () => !flag("minimized"),

          why:
            "É preciso resolver a falta de apoio causada " +
            "pelo relato inicial."
        }
      )
    ]
  ),

  testimony: scene(
    () => flag("liaHub") ? 2 : 3,

    "Posto de atendimento",
    "O que Lia viu",

    () =>
      "Lia está sentada na maca, com fuligem na manga e uma " +
      "pulseira de identificação. " +
      (
        flag("reckless")
          ? "Ela olha para a sua perna enfaixada. “Você não " +
            "precisava ter entrado. Eu precisava que chamasse " +
            "a equipe.”"
          : "“Eu ouvi quando você passou a localização”, " +
            "ela diz. “Foi quando soube que alguém viria.”"
      ) +
      "\n\n" +
      "Ela pede um minuto: “A ordem era encerrar a manutenção " +
      "antes da troca de turno. Mas o teste não tinha terminado. " +
      "Eu avisei. Você recebeu?”" +
      "\n\n" +
      "Lia não sabe tudo sobre o acidente. Sabe qual verificação " +
      "faltou e quem estava pressionando pelo encerramento.",

    [
      choice(
        "Ouvir e registrar o relato de Lia",

        () => flag("liaHub") ? "hub" : "record",

        2,

        "Lia indica o teste de retorno omitido e relata a " +
        "pressão para encerrar o serviço. Essa pista permitirá " +
        "localizar os registros técnicos mais rapidamente.",

        {
          run: () => {
            state.flags.testimony = true;
            state.flags.liaHeard = true;
            state.flags.liaHub = false;

            clue(
              "Lia: teste de retorno não concluído e pressão " +
              "para encerrar a ordem de manutenção."
            );
          }
        }
      ),

      choice(
        "Pedir que Lia não mencione sua assinatura",

        () => flag("liaHub") ? "hub" : "record",

        1,

        "Ela solta sua mão. “Eu não vou inventar nada para " +
        "você.” Lia pede para falar diretamente com Helena. " +
        "Sua tentativa de silenciá-la não impede um " +
        "depoimento independente.",

        {
          run: () => {
            state.flags.pressured = true;
            state.flags.liaHub = false;
          }
        }
      ),

      choice(
        "Dizer que precisa seguir e não registrar o depoimento",

        () => flag("liaHub") ? "hub" : "record",

        0,

        "“Então fala comigo depois”, Lia responde. Você deixa " +
        "o posto sem a pista técnica que ela poderia fornecer agora.",

        {
          run: () => {
            state.flags.skippedTestimony = true;
            state.flags.liaHub = false;
          }
        }
      )
    ]
  ),

  confrontation: scene(
    3,
    "Coordenação de emergência",
    "Duas versões na mesma tela",

    () =>
      "Helena gira o monitor. " +
      (
        flag("tampered")
          ? "A auditoria registra uma alteração feita no " +
            "terminal após o acidente. “Esta mudança também " +
            "é sua?”"
          : "O checklist não contém a segunda verificação " +
            "que você disse ter conferido. “Seu relato e " +
            "este documento não combinam.”"
      ) +
      "\n\n" +
      (
        flag("voicemail")
          ? "A mensagem preservada de Lia marca 03:31. "
          : ""
      ) +
      (
        flag("proof")
          ? "A cópia completa mostra a manutenção ainda pendente. "
          : ""
      ) +
      "Helena espera. “Você pode corrigir seu depoimento. " +
      "Mas eu não posso apagar a versão anterior.”",

    [
      choice(
        "Retificar o relato e entregar as evidências preservadas",
        "plan",
        2,

        "Sua retratação é anexada. Você assume a omissão e, " +
        "se houve alteração local, também a declara. Helena " +
        "encaminha os documentos, mantendo o histórico " +
        "para a investigação.",

        {
          need: () =>
            flag("proof") ||
            flag("voicemail") ||
            flag("testimony"),

          why:
            "Exige documentos, mensagem preservada " +
            "ou depoimento de Lia.",

          run: () => {
            state.flags.honest = true;
            state.flags.retracted = true;

            if (flag("tampered")) {
              state.flags.confessedTampering = true;
            }
          }
        }
      ),

      choice(
        "Reconstruir a sequência de memória e assumir as contradições",
        "plan",
        4,

        "A reconstrução demora mais, mas você corrige o " +
        "depoimento e declara a alteração local, caso a tenha " +
        "feito. Helena registra a retratação sem apagar " +
        "os atos anteriores.",

        {
          run: () => {
            state.flags.honest = true;
            state.flags.retracted = true;

            if (flag("tampered")) {
              state.flags.confessedTampering = true;
            }
          }
        }
      ),

      choice(
        "Manter a versão e negar responsabilidade pela divergência",
        "plan",
        1,

        "“Seu próximo relato terá uma segunda conferência”, " +
        "Helena diz. A equipe poderá usar evidências, mas " +
        "gastará mais tempo validando suas conclusões.",

        {
          run: () => {
            state.flags.doubledDown = true;
          }
        }
      )
    ]
  ),

  rescueSearch: scene(
    3,
    "Ligação com a brigada",
    "Uma busca precisa de um lugar",

    () =>
      (
        flag("liaLocated")
          ? "A posição que você transmitiu está na ficha. " +
            "A equipe pode acessar diretamente a passagem lateral."
          : "Você ainda não confirmou a posição de Lia. " +
            "A brigada terá de verificar dois compartimentos " +
            "antes de alcançá-la."
      ) +
      "\n\n" +
      (
        flag("teamLate")
          ? "A equipe veio de outro setor depois da mudança " +
            "de prioridade. O deslocamento acrescentará dois minutos."
          : "O apoio acionado inicialmente já está próximo."
      ) +
      "\n\n" +
      "Você pode acompanhar a busca pelo canal sem entrar " +
      "na área interditada.",

    [
      choice(
        "Acompanhar a busca e confirmar a retirada",
        "testimony",

        () =>
          (flag("liaLocated") ? 3 : 7) +
          (flag("teamLate") ? 2 : 0),

        "A brigada confirma a retirada de Lia e a encaminha " +
        "ao posto. Antes de você fechar o relatório, ela " +
        "pede para falar sobre a manutenção.",

        {
          run: () => {
            state.flags.liaSaved = true;
            state.flags.liaLocated = true;
            state.flags.liaHub = false;
          }
        }
      ),

      choice(
        "Transmitir o que sabe e seguir sem aguardar",
        "record",
        1,

        "A busca continua com a brigada. Você não terá " +
        "confirmação da retirada nem o relato de Lia " +
        "antes de redigir o documento.",

        {
          run: () => {
            state.flags.searchPending = true;
          }
        }
      )
    ]
  ),

  validation: scene(
    3,
    "Canal técnico",
    "A corrente continua nula",

    "Sua garantia de disponibilidade levou a equipe a conferir " +
    "novamente uma linha que não respondia. A engenheira pede " +
    "evidências antes de tentar outra alternativa. Helena fica " +
    "no canal, ouvindo." +
    "\n\n" +
    "O tempo usado na conferência não pode ser recuperado. " +
    "Você ainda pode corrigir a informação e ajudar a " +
    "investigação técnica.",

    [
      choice(
        "Retirar a garantia e entregar a evidência disponível",
        "dispatch",
        6,

        "Após seis minutos de revisão e validação, a equipe " +
        "confirma uma alternativa de remoção de calor. Sua " +
        "garantia inicial permanece registrada como " +
        "informação incorreta.",

        {
          need: () =>
            flag("checked") ||
            flag("proof") ||
            flag("testimony") ||
            flag("honest"),

          why:
            "Exige ao menos uma informação verificável " +
            "sobre a falha.",

          run: () => {
            state.flags.correctedAdvice = true;
            state.flags.stable = true;
          }
        }
      ),

      choice(
        "Reconhecer a incerteza e deixar a avaliação com a equipe",
        "dispatch",
        4,

        "A equipe descarta sua garantia e mantém as ações " +
        "conservadoras. A estabilidade não é confirmada " +
        "nesta janela.",

        {
          run: () => {
            state.flags.conservative = true;
          }
        }
      )
    ]
  ),

  communication: scene(
    4,
    "Terminal de comunicação",
    "Uma frase já saiu daqui",

    () => {
      if (flag("correctedPublic")) {
        return (
          "O comando recebeu sua correção. Uma equipe de " +
          "recepção, porém, ainda tem a nota anterior: " +
          "“Não há qualquer risco.” A operadora precisa " +
          "confirmar o recebimento da nova versão antes " +
          "de dar baixa." +
          "\n\n" +
          "Corrigir uma informação exige alcançar quem " +
          "ouviu a primeira. Isso também custa tempo."
        );
      }

      return (
        "A operadora olha para o pedido de adiamento. " +
        "“Estamos organizando a recepção de trabalhadores. " +
        "Precisamos de informação, não de uma garantia de " +
        "que nada aconteceu.”" +
        "\n\n" +
        "Enquanto sua mensagem permanece incompleta, o " +
        "comando mantém medidas conservadoras. Você pode " +
        "retirar o pedido ou deixar a comunicação do seu " +
        "setor pendente."
      );
    },

    [
      choice(
        "Confirmar a correção com os destinatários",
        "decon",
        4,

        "A correção chega aos destinatários e é confirmada. " +
        "A preparação é atualizada; o atraso e a primeira " +
        "mensagem permanecem no registro.",

        {
          need: () => flag("correctedPublic"),

          why: "Exige uma correção já enviada.",

          run: () => {
            state.flags.correctionConfirmed = true;
          }
        }
      ),

      choice(
        "Retirar o pedido de adiamento e transmitir os fatos",
        "decon",
        4,

        "Você retira o pedido e envia uma atualização sem " +
        "garantias infundadas. O comando confirma o recebimento, " +
        "mas registra o atraso.",

        {
          need: () => !flag("correctedPublic"),

          why:
            "A correção já foi enviada; falta confirmar " +
            "o recebimento.",

          run: () => {
            state.flags.withdrawnDelay = true;
            state.flags.external = true;

            if (flag("falseReassurance")) {
              state.flags.correctedPublic = true;
              state.flags.correctionConfirmed = true;
            }
          }
        }
      ),

      choice(
        "Seguir sem confirmar a atualização",
        "decon",
        1,

        "Você deixa o terminal sem confirmar o alcance da " +
        "atualização. A recepção mantém procedimentos " +
        "conservadores e levará mais tempo para organizar " +
        "sua saída.",

        {
          run: () => {
            state.flags.communicationPending = true;

            alertEvent(
              "Atualização não confirmada. Recepção em " +
              "procedimento conservador; saída coordenada " +
              "terá atraso."
            );
          }
        }
      )
    ]
  )
});

/* =========================================================
   EXPLORAÇÃO DOS SETORES
   ========================================================= */

function hubChoices() {
  const options = Object.entries(SECTORS).map(
    ([id, name]) =>
      choice(
        `Explorar: ${name}`,
        id,
        1,

        `Você chega a ${name.toLowerCase()}.`,

        {
          need: () => !state.visited.includes(id),

          why: "Setor já visitado.",

          run: () => {
            state.visited.push(id);
          }
        }
      )
  );

  options.push(
    choice(
      "Seguir para a coordenação — encerrar exploração",
      "responsibility",
      2,

      "Você deixa os setores restantes para as equipes " +
      "especializadas."
    )
  );

  return options;
}

function currentChoices() {
  return state.node === "hub"
    ? hubChoices()
    : SCENES[state.node].choices;
}

/* =========================================================
   RELÓGIO, EXPOSIÇÃO E EVENTOS
   ========================================================= */

function tick(minutes, rate = 0) {
  const before = state.minutes;

  state.minutes += minutes;

  state.dose +=
    minutes *
    rate *
    (flag("escalated") ? 1.5 : 1);

  /*
    Material externo pode contribuir para exposição
    enquanto permanece presente.

    O coeficiente abaixo é fictício e não tem valor clínico.
  */
  if (state.contamination > 0) {
    state.dose +=
      minutes *
      state.contamination *
      0.004;
  }

  state.dose = Math.round(state.dose * 10) / 10;

  if (before < 35 && state.minutes >= 35) {
    state.flags.escalated = true;

    alertEvent(
      "03:42 + 35 min: danos na galeria ampliam o perímetro " +
      "interditado. Exposição em deslocamentos de risco aumenta."
    );
  }

  if (!flag("doseAlert") && state.dose >= 40) {
    state.flags.doseAlert = true;

    alertEvent(
      "Índice fictício de dose elevado: a avaliação especializada " +
      "é necessária, mesmo sem sintomas. Isto não é um limiar clínico."
    );
  }
}

/* =========================================================
   SELEÇÃO DOS FINAIS
   ========================================================= */

function resolveEnding() {
  if (state.health <= 0) {
    state.ending = "collapse";
  } else if (
    state.minutes >= 70 ||
    flag("rescued")
  ) {
    state.ending = "rescue";
  } else if (flag("abandoned")) {
    state.ending = "alone";
  } else if (
    (flag("lied") && !flag("retracted")) ||
    flag("coverup") ||
    flag("tampered") ||
    flag("pressured")
  ) {
    state.ending = "silence";
  } else if (
    flag("stable") &&
    flag("honest") &&
    flag("report") &&
    flag("external") &&
    flag("liaSaved") &&
    !flag("communicationPending") &&
    (
      !flag("delayed") ||
      flag("withdrawnDelay")
    )
  ) {
    state.ending = "dawn";
  } else {
    state.ending = "witness";
  }

  state.node = "finish";
}

/* =========================================================
   PROCESSAMENTO DAS DECISÕES
   ========================================================= */

function choose(index) {
  if (state.ending) {
    return;
  }

  const option = currentChoices()[index];

  if (
    !option ||
    (option.need && !option.need())
  ) {
    return;
  }

  /*
    Resolve informações antes de aplicar as consequências.
    Assim, os textos correspondem à escolha que foi oferecida.
  */
  const from = SCENES[state.node].title;
  const duration = value(option.t);
  const next = value(option.to);
  const result = value(option.result);
  const remaining = 70 - state.minutes;

  if (duration > remaining) {
    tick(remaining, option.r || 0);

    state.flags.interrupted = true;

    state.last =
      "A ação foi interrompida antes de ser concluída. " +
      "A janela de deslocamento encerrou; a brigada organiza " +
      "sua retirada assistida. O resultado pretendido " +
      "não foi confirmado.";

    state.history.push({
      time: clock(state.minutes),
      scene: from,
      decision: option.text + " [interrompida]",
      result: state.last
    });

    alertEvent(
      "Janela encerrada. Ação interrompida; " +
      "seus efeitos não foram concluídos."
    );

    resolveEnding();
  } else {
    tick(duration, option.r || 0);

    state.health = Math.max(
      0,
      Math.min(
        100,
        state.health + (option.h || 0)
      )
    );

    /*
      A roupa reduz contato com contaminantes.
      Ela não reduz a exposição penetrante calculada em tick().
    */
    state.contamination = Math.min(
      100,
      state.contamination +
        (option.c || 0) *
        (has("suit") ? 0.35 : 1)
    );

    if (option.run) {
      option.run();
    }

    state.contamination = Math.round(
      state.contamination
    );

    state.last = result;

    state.history.push({
      time: clock(state.minutes),
      scene: from,
      decision: option.text,
      result
    });

    state.node = next;

    if (
      state.health <= 0 ||
      state.minutes >= 70 ||
      state.node === "finish"
    ) {
      if (
        state.minutes >= 70 &&
        state.health > 0
      ) {
        state.last +=
          " A janela de deslocamento encerrou. " +
          "A equipe organiza retirada assistida.";

        alertEvent(
          "Janela de deslocamento encerrada: " +
          "retirada assistida obrigatória."
        );
      }

      resolveEnding();
    }
  }

  render();
  save(true);

  $("scene-title").focus();
}

/* =========================================================
   EPÍLOGOS
   ========================================================= */

const ENDINGS = {
  dawn: [
    "01 / Depois da madrugada",

    "Você sai com o grupo quando o céu começa a clarear. " +
    "Lia está viva. A remoção de calor foi estabilizada e " +
    "os registros completos chegaram à investigação. Nada " +
    "disso desfaz sua assinatura: você será ouvido e poderá " +
    "responder pela omissão. Mas a equipe recebeu a verdade " +
    "a tempo de agir."
  ],

  witness: [
    "02 / Testemunha de uma noite",

    "Você chega ao ponto de reunião, mas a madrugada deixa " +
    "perguntas abertas. O que foi documentado permite " +
    "reconstruir parte da cadeia de falhas. Equipes seguem " +
    "trabalhando; sua colaboração nos próximos dias pode " +
    "esclarecer o que ainda falta."
  ],

  silence: [
    "03 / O peso do silêncio",

    "Você sobrevive e entrega sua identificação. Dias depois, " +
    "a auditoria cruza horários, cópias e depoimentos. As " +
    "contradições e omissões passam a ser investigadas junto " +
    "com o acidente. Preservar a própria imagem durante " +
    "alguns minutos criou consequências que durarão muito mais."
  ],

  alone: [
    "04 / Além da cerca",

    "Você atravessa o acesso de serviço sozinho. Do lado " +
    "de fora, não há a certeza de segurança que imaginava. " +
    "Seu nome permanece na lista de desaparecidos até você " +
    "ser localizado. A saída sem controle prejudica a " +
    "contagem e pode levar material contaminado para " +
    "outros lugares."
  ],

  rescue: [
    "05 / A espera",

    "A movimentação termina antes de uma saída convencional. " +
    "A brigada organiza sua retirada assistida. Você " +
    "sobrevive, mas parte das decisões fica nas mãos de " +
    "quem chega depois. No posto de atendimento, cada " +
    "lacuna do registro será uma pergunta."
  ],

  collapse: [
    "06 / Turno interrompido",

    "O túnel cede antes da saída. O trauma estrutural é " +
    "fatal; não se trata de um efeito instantâneo de " +
    "radiação. O registro das decisões é recuperado e " +
    "incorporado à investigação. A última rota era um " +
    "risco industrial anunciado."
  ]
};

/* =========================================================
   RELATÓRIO DAS CONSEQUÊNCIAS
   ========================================================= */

function outcomes() {
  return [
    "Instalação: " +
      (
        flag("stable")
          ? "remoção de calor estabilizada; avaliação ambiental continua"
          : "estabilização não confirmada; resposta técnica continua"
      ) +
      ".",

    "Lia: " +
      (
        flag("liaSaved")
          ? "resgatada e encaminhada ao posto médico"
          : flag("liaLocated")
            ? "localização transmitida; retirada não confirmada no seu registro"
            : "situação não confirmada no seu registro"
      ) +
      ".",

    "Comunicação: " +
      (
        flag("external")
          ? "comando recebeu relato para comunicação às autoridades"
          : "comunicação externa não confirmada por você"
      ) +
      (
        flag("delayed")
          ? "; pedido posterior de adiamento registrado"
          : ""
      ) +
      ".",

    `Investigação: ${state.evidence.length} pistas; ` +
      (
        flag("submitted")
          ? "cópia dos documentos entregue"
          : has("archive")
            ? "cópia preservada com você"
            : "sem cópia autenticada no inventário"
      ) +
      ".",

    "Responsabilidade: " +
      (
        flag("honest")
          ? "omissão assumida"
          : "omissão não assumida"
      ) +
      "; " +
      (
        flag("tampered")
          ? "registro adulterado; "
          : ""
      ) +
      (
        flag("report")
          ? "relatório factual preservado"
          : "relatório completo não entregue"
      ) +
      ".",

    `Avaliação: ${state.health}/100 de integridade; ` +
      `dose fictícia ${state.dose}; ` +
      `contaminação externa ${state.contamination}/100. ` +
      (
        flag("assessed")
          ? "Avaliação iniciada; acompanhamento ainda necessário."
          : "Avaliação especializada pendente."
      ),

    "Saída: " +
      (
        flag("spread")
          ? "risco de transferência de material para áreas limpas"
          : flag("segregated")
            ? "transporte segregado solicitado"
            : flag("decon")
              ? "controle de contaminação realizado"
              : "controle de contaminação não confirmado"
      ) +
      "."
  ];
}

/* =========================================================
   CONSEQUÊNCIAS QUE REAPARECEM NO EPÍLOGO
   ========================================================= */

function aftermath() {
  const paragraphs = [];

  if (flag("teamLate")) {
    paragraphs.push(
      "Apoio: seu relato inicial reduziu a prioridade do setor. " +
      "A equipe chegou mais tarde. " +
      (
        flag("correctedBrief")
          ? "Você corrigiu a avaliação, mas o atraso permaneceu."
          : "A brigada precisou confirmar os danos por outro canal."
      )
    );
  } else if (flag("contact")) {
    paragraphs.push(
      "Apoio: o relato inicial permitiu posicionar a equipe " +
      "antes dos pedidos seguintes."
    );
  } else {
    paragraphs.push(
      "Apoio: sua partida terminou antes de confirmar " +
      "a mobilização da equipe."
    );
  }

  if (flag("testimony")) {
    paragraphs.push(
      "Lia: o depoimento sobre o teste omitido e a pressão " +
      "para encerrar a manutenção foi preservado. " +
      (
        flag("evidencePlan")
          ? "A pista reduziu o tempo necessário para " +
            "localizar registros técnicos."
          : "A pista ficou disponível para a avaliação técnica."
      )
    );
  } else if (flag("pressured")) {
    paragraphs.push(
      "Lia: ela procurou Helena por conta própria. Sua " +
      "tentativa de silenciá-la será apurada separadamente " +
      "da falha técnica."
    );
  } else if (flag("liaSaved")) {
    paragraphs.push(
      "Lia: sobreviveu, mas seu registro não contém o " +
      "depoimento dela sobre a manutenção."
    );
  }

  if (flag("retracted")) {
    paragraphs.push(
      "Helena: recebeu sua retratação. O esclarecimento " +
      "permitiu retomar a colaboração; a primeira versão " +
      "e eventuais alterações permanecem na auditoria."
    );
  } else if (flag("doubledDown")) {
    paragraphs.push(
      "Helena: determinou uma segunda conferência das " +
      "suas conclusões. " +
      (
        flag("reviewApplied")
          ? "A revisão exigiu tempo adicional durante a resposta."
          : "Seu relato permaneceu sujeito a validação adicional."
      )
    );
  }

  if (flag("badAdvice")) {
    paragraphs.push(
      "Informação técnica: a garantia de que a linha " +
      "estava pronta exigiu uma nova conferência. " +
      (
        flag("correctedAdvice")
          ? "Você a retirou e ajudou a validar a alternativa."
          : "A estabilidade não foi confirmada a partir " +
            "do seu relato."
      )
    );
  }

  if (
    flag("falseReassurance") ||
    flag("delayed")
  ) {
    paragraphs.push(
      "Comunicação: " +
      (
        flag("correctionConfirmed") ||
        flag("withdrawnDelay")
          ? "a atualização foi confirmada, com a demora registrada."
          : "a versão completa não teve alcance confirmado; " +
            "a recepção precisou manter medidas conservadoras."
      )
    );
  }

  if (state.ending === "collapse") {
    paragraphs.push(
      "Semanas depois: a comissão recupera seu registro. " +
      "As escolhas documentadas ajudam a reconstruir a " +
      "resposta, mas não há um depoimento seu para " +
      "esclarecer as lacunas."
    );
  } else if (
    flag("tampered") ||
    flag("coverup") ||
    flag("pressured")
  ) {
    paragraphs.push(
      "Semanas depois: a comissão abre uma apuração " +
      "específica sobre a integridade dos registros e " +
      "a condução dos depoimentos. " +
      (
        flag("confessedTampering")
          ? "Sua admissão da alteração também foi anexada; " +
            "ela não desfaz o ato."
          : "Os fatos preservados serão confrontados " +
            "com sua versão."
      )
    );
  } else if (
    flag("honest") &&
    flag("report")
  ) {
    paragraphs.push(
      "Semanas depois: você é ouvido sobre a assinatura " +
      "e a falha de verificação. Sua colaboração ajuda " +
      "a reconstruir o acidente, mas não garante absolvição " +
      "nem estabilidade no emprego."
    );
  } else {
    paragraphs.push(
      "Semanas depois: a investigação ainda precisa " +
      "reconstruir os trechos que você não esclareceu. " +
      "Sua situação profissional permanece indefinida."
    );
  }

  return paragraphs;
}

/* =========================================================
   CRIAÇÃO DOS ELEMENTOS DA INTERFACE
   ========================================================= */

function element(tag, text, parent, className) {
  const e = document.createElement(tag);

  e.textContent = text;

  if (className) {
    e.className = className;
  }

  parent.append(e);

  return e;
}

function fillList(id, values) {
  const list = $(id);

  list.replaceChildren();

  values.forEach(item => {
    element("li", item, list);
  });
}

/* =========================================================
   ATUALIZAÇÃO DA TELA
   ========================================================= */

function render() {
  $("menu").classList.add("hidden");
  $("game").classList.remove("hidden");

  $("clock").textContent = clock(state.minutes);

  $("elapsed").textContent =
    `${state.minutes} min desde o incidente · ` +
    "limite narrativo: 70 min";

  const indicators = [
    ["health", state.health],
    ["radiation", state.dose],
    ["contamination", state.contamination]
  ];

  for (const [prefix, amount] of indicators) {
    $(`${prefix}-value`).textContent =
      prefix === "radiation"
        ? `${amount} u.f.`
        : `${amount}/100`;

    $(`${prefix}-bar`).value = Math.min(
      100,
      amount
    );
  }

  $("radiation-value").title = has("dosimeter")
    ? "Leitura fictícia do dosímetro"
    : "Estimativa narrativa; personagem sem dosímetro";

  /* Inventário */

  $("inventory").replaceChildren();

  if (!state.items.length) {
    element(
      "li",
      "Nenhum equipamento",
      $("inventory")
    );
  }

  state.items.forEach(item => {
    const li = element(
      "li",
      ITEMS[item],
      $("inventory")
    );

    if (
      item === "kit" &&
      !state.ending
    ) {
      const button = element(
        "button",
        "Usar kit · 2 min",
        li,
        "secondary"
      );

      button.disabled = state.health >= 100;
      button.onclick = useKit;
    }
  });

  /* Mapa */

  $("map").replaceChildren();

  Object.entries(SECTORS).forEach(
    ([id, name]) => {
      const visited = state.visited.includes(id);

      element(
        "li",
        `${visited ? "✓" : "○"} ${name}`,
        $("map"),
        visited ? "visited" : ""
      );
    }
  );

  /* Alertas */

  $("alerts").replaceChildren();

  state.alerts
    .slice(-5)
    .reverse()
    .forEach(alert => {
      const li = element(
        "li",
        "",
        $("alerts")
      );

      element("time", alert.time, li);
      element("span", alert.text, li);
    });

  /* Pistas e decisões */

  fillList(
    "evidence",
    state.evidence.length
      ? state.evidence
      : ["Nenhuma pista preservada."]
  );

  fillList(
    "history",
    state.history.map(
      entry =>
        `${entry.time} — ${entry.decision}. ${entry.result}`
    )
  );

  $("consequence").textContent = state.last;

  $("choices").replaceChildren();
  $("story-text").replaceChildren();

  $("ending").classList.toggle(
    "hidden",
    !state.ending
  );

  /* Tela final */

  if (state.ending) {
    $("chapter").textContent =
      "EPÍLOGO / REGISTRO ENCERRADO";

    $("location").textContent =
      "Usina Aurora • relatório pós-incidente";

    $("scene-title").textContent =
      ENDINGS[state.ending][0];

    element(
      "p",
      ENDINGS[state.ending][1],
      $("story-text")
    );

    $("report").replaceChildren();

    [
      ...outcomes(),
      ...aftermath()
    ].forEach(text => {
      element("p", text, $("report"));
    });

    const ol = element(
      "ol",
      "",
      $("report")
    );

    state.history.forEach(entry => {
      element(
        "li",
        `${entry.time} — ${entry.decision}. ${entry.result}`,
        ol
      );
    });

    return;
  }

  /* Cena atual */

  const currentScene = SCENES[state.node];

  $("chapter").textContent =
    `CAPÍTULO ${value(currentScene.chapter)} / 4`;

  $("location").textContent =
    currentScene.location;

  $("scene-title").textContent =
    currentScene.title;

  const narrative = value(currentScene.text);

  narrative.split("\n\n").forEach(paragraph => {
    element(
      "p",
      paragraph,
      $("story-text")
    );
  });

  currentChoices().forEach(
    (option, index) => {
      const button = element(
        "button",
        option.text,
        $("choices")
      );

      const locked =
        option.need &&
        !option.need();

      button.disabled = Boolean(locked);

      element(
        "small",
        `${value(option.t)} min` +
          (
            locked
              ? ` · ${option.why}`
              : ""
          ),
        button
      );

      button.onclick = () => choose(index);
    }
  );
}

/* =========================================================
   USO DO KIT
   ========================================================= */

function useKit() {
  if (
    state.ending ||
    !has("kit") ||
    state.health >= 100
  ) {
    return;
  }

  if (state.minutes + 2 > 70) {
    tick(70 - state.minutes);

    state.flags.interrupted = true;

    state.last =
      "O atendimento é interrompido pela retirada assistida. " +
      "O kit não foi consumido nem concluiu o cuidado.";

    state.history.push({
      time: clock(state.minutes),
      scene: "Inventário",
      decision: "Usar kit [interrompido]",
      result: state.last
    });

    resolveEnding();
    render();
    save(true);

    return;
  }

  state.items = state.items.filter(
    item => item !== "kit"
  );

  tick(2);

  state.health = Math.min(
    100,
    state.health + 15
  );

  state.last =
    "Você cuida de ferimentos leves. O kit não reduz dose " +
    "nem remove contaminação.";

  state.history.push({
    time: clock(state.minutes),
    scene: "Inventário",
    decision: "Usar kit",
    result: state.last
  });

  if (state.minutes >= 70) {
    resolveEnding();
  }

  render();
  save(true);
}

/* =========================================================
   NOTIFICAÇÕES
   ========================================================= */

function notify(text) {
  $("notice").textContent = text;

  clearTimeout(noticeTimer);

  noticeTimer = setTimeout(() => {
    $("notice").textContent = "";
  }, 6000);
}

/* =========================================================
   SALVAMENTO
   ========================================================= */

function save(automatic = false) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(state)
    );

    if (!automatic) {
      notify(
        "Partida salva neste navegador."
      );
    }
  } catch {
    notify(
      "Não foi possível salvar. O armazenamento do navegador " +
      "está indisponível; mantenha esta aba aberta."
    );
  }
}

/* =========================================================
   VALIDAÇÃO DO SALVAMENTO
   ========================================================= */

function valid(s) {
  if (
    !s ||
    s.version !== 2 ||
    !Number.isFinite(s.minutes) ||
    s.minutes < 0 ||
    s.minutes > 200
  ) {
    return false;
  }

  if (
    !["health", "dose", "contamination"].every(
      key =>
        Number.isFinite(s[key]) &&
        s[key] >= 0
    )
  ) {
    return false;
  }

  if (
    s.health > 100 ||
    s.contamination > 100 ||
    s.dose > 10000
  ) {
    return false;
  }

  if (
    !s.flags ||
    typeof s.flags !== "object" ||
    Array.isArray(s.flags) ||
    !Object.values(s.flags).every(
      item => typeof item === "boolean"
    )
  ) {
    return false;
  }

  if (
    typeof s.last !== "string" ||
    !Array.isArray(s.items) ||
    !s.items.every(
      item => Object.hasOwn(ITEMS, item)
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(s.visited) ||
    !s.visited.every(
      id => Object.hasOwn(SECTORS, id)
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(s.evidence) ||
    !s.evidence.every(
      item => typeof item === "string"
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(s.history) ||
    !s.history.every(
      entry =>
        entry &&
        [
          "time",
          "scene",
          "decision",
          "result"
        ].every(
          key => typeof entry[key] === "string"
        )
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(s.alerts) ||
    !s.alerts.every(
      alert =>
        alert &&
        typeof alert.time === "string" &&
        typeof alert.text === "string"
    )
  ) {
    return false;
  }

  if (s.ending !== null) {
    return (
      Object.hasOwn(ENDINGS, s.ending) &&
      s.node === "finish"
    );
  }

  return (
    Object.hasOwn(SCENES, s.node) &&
    s.minutes < 70 &&
    s.health > 0
  );
}

/* =========================================================
   CARREGAMENTO
   ========================================================= */

function load() {
  try {
    const raw = localStorage.getItem(KEY);

    if (!raw) {
      const legacy = localStorage.getItem(
        LEGACY_KEY
      );

      notify(
        legacy
          ? "Seu salvamento da primeira edição foi preservado. " +
            "Inicie um novo turno para jogar a narrativa atualizada."
          : "Nenhuma partida salva nesta edição e neste navegador."
      );

      return;
    }

    const next = JSON.parse(raw);

    if (!valid(next)) {
      throw new Error("invalid");
    }

    state = next;

    render();

    $("scene-title").focus();

    notify("Partida carregada.");
  } catch {
    notify(
      "Não foi possível carregar: salvamento inválido, " +
      "incompatível ou armazenamento bloqueado."
    );
  }
}

/* =========================================================
   INÍCIO E REINÍCIO
   ========================================================= */

function start() {
  state = fresh();

  alertEvent(
    "Incêndio elétrico. Reator desligado. " +
    "Refrigeração não confirmada."
  );

  render();
  save(true);

  $("scene-title").focus();
}

function restart() {
  const confirmed = window.confirm(
    "Iniciar um novo turno e substituir o salvamento atual?"
  );

  if (confirmed) {
    start();
  }
}

/* =========================================================
   EXPORTAÇÃO DO RELATÓRIO
   ========================================================= */

function downloadReport() {
  if (!state.ending) {
    return;
  }

  const text = [
    "CONTAINMENT — " + ENDINGS[state.ending][0],

    ENDINGS[state.ending][1],

    ...outcomes(),

    ...aftermath(),

    "DECISÕES",

    ...state.history.map(
      entry =>
        `${entry.time} | ${entry.scene} | ${entry.decision}` +
        `\n${entry.result}`
    ),

    "Modelo fictício educativo. " +
    "Sem equivalência dos índices em dose clínica."
  ].join("\n\n");

  const blob = new Blob(
    [text],
    {
      type: "text/plain;charset=utf-8"
    }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = "containment-relatorio.txt";

  document.body.append(a);

  a.click();
  a.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/* =========================================================
   EVENTOS DOS BOTÕES
   ========================================================= */

$("start-btn").onclick = () => {
  let exists = false;

  try {
    exists = Boolean(
      localStorage.getItem(KEY)
    );
  } catch {
    /*
      O jogo continua mesmo se o armazenamento
      estiver indisponível.
    */
  }

  if (
    !exists ||
    window.confirm(
      "Um salvamento existe. Substituí-lo por um novo turno?"
    )
  ) {
    start();
  }
};

$("load-menu").onclick = load;

$("load-btn").onclick = load;

$("save-btn").onclick = () => {
  save();
};

$("restart-btn").onclick = restart;

$("again-btn").onclick = restart;

$("download-btn").onclick = downloadReport;
/* =========================================================
   CONTAINMENT — SISTEMA COMPLETO DE ÁUDIO
   Cole no final do script.js, depois do código do jogo.
   Não precisa alterar HTML, CSS ou assets.
   ========================================================= */

(() => {
  "use strict";

  // Evita duplicar controles se o bloco for colado duas vezes.
  if (window.__containmentAudio) return;
  window.__containmentAudio = true;

  const AudioEngine =
    window.AudioContext || window.webkitAudioContext;

  const preferenceKey = "containment-audio-v1";

  let enabled = true;
  let volume = 0.18;

  /* Preferências salvas */

  try {
    const preference = JSON.parse(
      localStorage.getItem(preferenceKey)
    );

    if (
      preference &&
      typeof preference.enabled === "boolean"
    ) {
      enabled = preference.enabled;
    }

    if (
      preference &&
      Number.isFinite(preference.volume)
    ) {
      volume = Math.max(
        0,
        Math.min(1, preference.volume)
      );
    }
  } catch {
    // Usa volume baixo quando as preferências estão indisponíveis.
  }

  let context = null;
  let master = null;
  let ambience = null;
  let noiseBuffer = null;
  let previous = null;
  let starting = null;
  let failed = false;

  const voices = new Set();

  /* =======================================================
     APARÊNCIA DOS CONTROLES
     ======================================================= */

  const style = document.createElement("style");

  style.textContent = `
    .audio-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 12px;
      padding: 12px 20px;
      border-bottom: 1px solid #30373e;
      background: #11161b;
      color: #ecede8;
      font: 12px Arial, sans-serif;
    }

    .audio-controls button {
      padding: 8px 12px;
      min-height: 36px;
    }

    .audio-controls label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font: 12px Arial, sans-serif;
    }

    .audio-controls input {
      width: 110px;
      accent-color: #edc65a;
      cursor: pointer;
    }

    .audio-controls input:focus-visible {
      outline: 2px solid #edc65a;
      outline-offset: 4px;
    }

    .audio-controls output {
      min-width: 32px;
      color: #edc65a;
    }

    .audio-controls span {
      color: #a4aeb7;
      font-size: 11px;
    }
  `;

  document.head.append(style);

  /* =======================================================
     CRIAÇÃO DOS BOTÕES E CONTROLE DE VOLUME
     ======================================================= */

  const controls = document.createElement("div");

  controls.className = "audio-controls";

  controls.setAttribute("role", "group");
  controls.setAttribute(
    "aria-label",
    "Controles de áudio"
  );

  controls.innerHTML = `
    <button
      type="button"
      id="audio-toggle"
      class="secondary"
    ></button>

    <label for="audio-volume">
      Volume
      <input
        id="audio-volume"
        type="range"
        min="0"
        max="100"
        step="1"
      >
    </label>

    <output
      id="audio-level"
      for="audio-volume"
    ></output>

    <span id="audio-info" role="status">
      O áudio começa ao iniciar ou carregar uma partida.
    </span>
  `;

  document.getElementById("app").prepend(controls);

  const toggle = document.getElementById("audio-toggle");
  const slider = document.getElementById("audio-volume");
  const level = document.getElementById("audio-level");
  const info = document.getElementById("audio-info");

  function persist() {
    try {
      localStorage.setItem(
        preferenceKey,
        JSON.stringify({
          enabled,
          volume
        })
      );
    } catch {
      // O áudio funciona mesmo sem salvar preferências.
    }
  }

  function updateControls() {
    toggle.textContent = enabled
      ? "SOM: LIGADO"
      : "SOM: DESLIGADO";

    toggle.setAttribute(
      "aria-pressed",
      String(enabled)
    );

    toggle.setAttribute(
      "aria-label",
      enabled ? "Desligar som" : "Ligar som"
    );

    slider.value = String(
      Math.round(volume * 100)
    );

    level.textContent =
      `${Math.round(volume * 100)}%`;
  }

  function inGame() {
    return !document
      .getElementById("game")
      .classList.contains("hidden");
  }

  function canPlay() {
    return (
      context &&
      context.state === "running" &&
      enabled &&
      volume > 0 &&
      !document.hidden
    );
  }

  /* Transição suave de volume */

  function ramp(gain, target, seconds = 0.08) {
    const now = context.currentTime;

    gain.gain.cancelScheduledValues(now);

    gain.gain.setTargetAtTime(
      target,
      now,
      seconds
    );
  }

  function clearEffects() {
    for (const source of [...voices]) {
      try {
        source.stop();
      } catch {
        // A fonte pode já ter sido encerrada.
      }
    }

    voices.clear();
  }

  function failAudio() {
    failed = true;
    enabled = false;

    if (context) {
      clearEffects();
      context.close().catch(() => {});
    }

    context = null;

    updateControls();

    toggle.disabled = true;
    slider.disabled = true;

    info.textContent =
      "Áudio indisponível neste navegador. " +
      "O jogo continua normalmente.";
  }

  /* =======================================================
     CRIAÇÃO DO AMBIENTE SONORO
     ======================================================= */

  function createAudio() {
    context = new AudioEngine();

    master = context.createGain();
    master.gain.value = 0;

    const limiter =
      context.createDynamicsCompressor();

    limiter.threshold.value = -12;
    limiter.knee.value = 20;
    limiter.ratio.value = 8;

    master.connect(limiter);
    limiter.connect(context.destination);

    /*
      O mesmo ruído é reutilizado na ventilação
      e nas interferências de rádio.
    */
    noiseBuffer = context.createBuffer(
      1,
      context.sampleRate * 2,
      context.sampleRate
    );

    const data = noiseBuffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    ambience = context.createGain();
    ambience.gain.value = 0;
    ambience.connect(master);

    /* Ventilação */

    const fan = context.createBufferSource();

    fan.buffer = noiseBuffer;
    fan.loop = true;

    const filter =
      context.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.value = 380;

    fan.connect(filter);
    filter.connect(ambience);

    fan.start();

    /* Zumbido discreto de máquinas */

    for (const frequency of [50, 100]) {
      const oscillator =
        context.createOscillator();

      const gain = context.createGain();

      oscillator.frequency.value = frequency;
      gain.gain.value = 0.1;

      oscillator.connect(gain);
      gain.connect(ambience);

      oscillator.start();
    }
  }

  /* =======================================================
     ATIVAÇÃO APÓS INTERAÇÃO DO JOGADOR
     ======================================================= */

  async function unlock() {
    if (
      !AudioEngine ||
      failed ||
      !enabled ||
      volume === 0 ||
      document.hidden
    ) {
      return;
    }

    if (starting) {
      return starting;
    }

    starting = (async () => {
      try {
        if (!context) {
          createAudio();
        }

        if (context.state !== "running") {
          await context.resume();
        }

        if (
          document.hidden ||
          !enabled ||
          volume === 0
        ) {
          await context.suspend();
          return;
        }

        ramp(master, volume);

        info.textContent =
          "Ambiente e efeitos sintetizados · " +
          "preferências salvas neste navegador.";
      } catch {
        failAudio();
      }
    })();

    await starting;
    starting = null;
  }

  /* =======================================================
     GERENCIAMENTO DOS EFEITOS
     ======================================================= */

  function voice(
    source,
    gain,
    startTime,
    duration,
    cleanup = []
  ) {
    if (voices.size >= 24) return;

    voices.add(source);

    source.onended = () => {
      voices.delete(source);

      source.disconnect();
      gain.disconnect();

      cleanup.forEach(node => {
        node.disconnect();
      });
    };

    source.start(startTime);
    source.stop(startTime + duration + 0.04);
  }

  function tone(
    frequency,
    duration,
    delay = 0,
    amplitude = 0.1,
    type = "sine",
    endFrequency = frequency
  ) {
    if (
      !canPlay() ||
      voices.size >= 24
    ) {
      return;
    }

    const startTime =
      context.currentTime + delay;

    const oscillator =
      context.createOscillator();

    const gain = context.createGain();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
      frequency,
      startTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      endFrequency,
      startTime + duration
    );

    gain.gain.setValueAtTime(
      0,
      startTime
    );

    gain.gain.linearRampToValueAtTime(
      amplitude,
      startTime + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(master);

    voice(
      oscillator,
      gain,
      startTime,
      duration
    );
  }

  /* =======================================================
     INTERFERÊNCIA DE RÁDIO
     ======================================================= */

  function radio() {
    if (
      !canPlay() ||
      voices.size >= 24
    ) {
      return;
    }

    const now = context.currentTime;

    const source =
      context.createBufferSource();

    const filter =
      context.createBiquadFilter();

    const gain = context.createGain();

    source.buffer = noiseBuffer;

    filter.type = "bandpass";
    filter.frequency.value = 1700;
    filter.Q.value = 0.8;

    gain.gain.setValueAtTime(0, now);

    gain.gain.linearRampToValueAtTime(
      0.12,
      now + 0.025
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + 0.35
    );

    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    voice(
      source,
      gain,
      now,
      0.36,
      [filter]
    );

    tone(
      950,
      0.08,
      0.35,
      0.05
    );
  }

  /* =======================================================
     ALARME DISTANTE
     ======================================================= */

  function alarm() {
    // Breve: não repete continuamente durante a leitura.

    tone(
      420,
      0.7,
      0,
      0.09,
      "sine",
      650
    );

    tone(
      650,
      0.7,
      0.8,
      0.07,
      "sine",
      420
    );
  }

  /* =======================================================
     SEQUÊNCIAS SONORAS DOS FINAIS
     ======================================================= */

  function endingSound(ending) {
    const notes = {
      dawn: [
        261.63,
        329.63,
        392,
        523.25
      ],

      witness: [
        220,
        293.66,
        329.63
      ],

      silence: [
        220,
        207.65,
        164.81
      ],

      alone: [
        293.66,
        220,
        146.83
      ],

      rescue: [
        196,
        246.94,
        293.66
      ],

      collapse: [
        130.81,
        98,
        65.41
      ]
    };

    const sequence =
      notes[ending] || notes.witness;

    sequence.forEach((note, index) => {
      tone(
        note,
        1.3,
        index * 0.32,
        0.09
      );
    });
  }

  /* =======================================================
     SINCRONIZAÇÃO COM A HISTÓRIA
     ======================================================= */

  function sync(withEffects = true) {
    const playing = inGame();

    const snapshot = {
      node: state.node,
      ending: state.ending,
      decisions: state.history.length,
      alerts: state.alerts.length,
      minutes: state.minutes,
      playing
    };

    if (canPlay()) {
      ramp(
        ambience,
        playing && !state.ending ? 0.12 : 0,
        0.4
      );

      if (withEffects && playing) {
        const restarted =
          previous &&
          snapshot.decisions < previous.decisions;

        const changed =
          !previous ||
          !previous.playing ||
          restarted ||
          snapshot.node !== previous.node;

        if (
          state.ending &&
          (
            changed ||
            state.ending !== previous?.ending
          )
        ) {
          clearEffects();
          endingSound(state.ending);
        } else if (
          !state.ending &&
          changed &&
          state.node === "alarm"
        ) {
          clearEffects();
          alarm();
        } else if (
          !state.ending &&
          previous &&
          snapshot.alerts > previous.alerts
        ) {
          alarm();
        } else if (
          !state.ending &&
          changed &&
          [
            "brief",
            "echo",
            "relay",
            "dispatch",
            "rescueSearch",
            "communication"
          ].includes(state.node)
        ) {
          radio();
        }
      }
    }

    previous = snapshot;
  }

  /* =======================================================
     BOTÃO DE LIGAR E DESLIGAR
     ======================================================= */

  toggle.addEventListener(
    "click",
    async () => {
      enabled = !enabled;

      updateControls();
      persist();

      if (!enabled) {
        if (context) {
          master.gain.cancelScheduledValues(
            context.currentTime
          );

          master.gain.setValueAtTime(
            0,
            context.currentTime
          );

          clearEffects();

          context.suspend().catch(() => {});
        }

        info.textContent = "Som desligado.";
      } else {
        await unlock();
        sync(false);
      }
    }
  );

  /* =======================================================
     CONTROLE DE VOLUME
     ======================================================= */

  slider.addEventListener(
    "input",
    async () => {
      volume = Math.max(
        0,
        Math.min(
          1,
          Number(slider.value) / 100
        )
      );

      updateControls();
      persist();

      if (!enabled) return;

      if (volume === 0 && context) {
        master.gain.cancelScheduledValues(
          context.currentTime
        );

        master.gain.setValueAtTime(
          0,
          context.currentTime
        );

        clearEffects();

        context.suspend().catch(() => {});
      } else {
        await unlock();
        sync(false);
      }
    }
  );

  /* =======================================================
     CLIQUES E DECISÕES DO JOGO
     ======================================================= */

  document.addEventListener(
    "click",
    event => {
      const button = event.target.closest("button");

      if (
        !button ||
        button.disabled ||
        controls.contains(button)
      ) {
        return;
      }

      if (
        !document
          .getElementById("app")
          .contains(button)
      ) {
        return;
      }

      const ready = unlock();

      /*
        A decisão original do jogo executa primeiro.
        Depois o áudio acompanha a nova cena.
      */
      queueMicrotask(async () => {
        await ready;

        if (
          inGame() &&
          !state.ending
        ) {
          tone(
            800,
            0.045,
            0,
            0.035,
            "triangle",
            500
          );
        }

        sync();
      });
    },
    true
  );

  /* =======================================================
     PAUSA AUTOMÁTICA AO TROCAR DE ABA
     ======================================================= */

  document.addEventListener(
    "visibilitychange",
    async () => {
      if (!context) return;

      if (document.hidden) {
        clearEffects();

        await context
          .suspend()
          .catch(() => {});
      } else if (
        enabled &&
        volume > 0
      ) {
        await unlock();
        sync(false);
      }
    }
  );

  /* Inicializa apenas os controles, sem tocar áudio. */

  updateControls();

  if (!AudioEngine) {
    failAudio();
  }
})();

/* =========================================================
   CONTAINMENT — CENÁRIOS VISUAIS
   As sete imagens ficam diretamente na pasta assets/.
   ========================================================= */

(() => {
  "use strict";

  if (document.getElementById("scene-art")) return;

  const folder = "assets/";

  const descriptions = {
    controle: "Sala de controle com painéis iluminados e uma cadeira vazia.",
    corredor: "Corredor industrial danificado sob iluminação vermelha de emergência.",
    abrigo: "Abrigo interno com bancos, armários e portas protegidas.",
    bombas: "Galeria de bombas vista de trás da barreira de segurança.",
    arquivo: "Arquivo técnico com documentos de manutenção e um terminal.",
    atendimento: "Posto de atendimento com maca e equipamento de avaliação radiológica.",
    exterior: "Exterior da usina ao amanhecer, com um ônibus no ponto de evacuação."
  };

  const sceneImages = {
    alarm: "controle",
    corridor: "corredor",
    brief: "controle",
    gear: "abrigo",
    echo: "controle",
    route: "corredor",
    arrival: "abrigo",
    hub: "abrigo",
    control: "controle",
    locker: "abrigo",
    archive: "arquivo",
    pumps: "bombas",
    aid: "atendimento",
    relay: "controle",
    responsibility: "arquivo",
    plan: "controle",
    dispatch: "controle",
    record: "arquivo",
    warning: "abrigo",
    decon: "atendimento",
    exit: "abrigo",
    testimony: "atendimento",
    confrontation: "arquivo",
    rescueSearch: "controle",
    validation: "controle",
    communication: "controle"
  };

  const endingImages = {
    dawn: "exterior",
    witness: "exterior",
    silence: "arquivo",
    alone: "exterior",
    rescue: "atendimento",
    collapse: "corredor"
  };

  /* Aparência da abertura e das imagens durante a partida */

  const style = document.createElement("style");

  style.textContent = `
    #menu {
      background-position: center;
      background-size: cover;
    }

    #menu h1 {
      text-shadow: 0 3px 30px #000;
    }

    #menu .intro,
    #menu .muted {
      color: #e0e5e9;
      text-shadow: 0 2px 6px #000;
    }

    #scene-art {
      margin: 0 0 26px;
      border: 1px solid #39434c;
      background: #090d11;
    }

    #scene-art .scene-image-area {
      aspect-ratio: 16 / 9;
      position: relative;
      overflow: hidden;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #1b252e, #090d11);
    }

    #scene-art img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      animation: scene-reveal 0.5s ease;
    }

    #scene-art .scene-placeholder {
      padding: 24px;
      text-align: center;
      color: #a4aeb7;
      font: 12px/1.7 monospace;
      overflow-wrap: anywhere;
    }

    #scene-art figcaption {
      padding: 10px 14px;
      border-top: 1px solid #39434c;
      color: #edc65a;
      font: 11px/1.6 monospace;
      letter-spacing: 1px;
    }

    @keyframes scene-reveal {
      from { opacity: 0.3; }
      to   { opacity: 1; }
    }

    @media (max-width: 650px) {
      #scene-art {
        margin-bottom: 20px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #scene-art img {
        animation: none;
      }
    }
  `;

  document.head.append(style);

  /* Cria o espaço da imagem acima do capítulo */

  const figure = document.createElement("figure");
  figure.id = "scene-art";

  const area = document.createElement("div");
  area.className = "scene-image-area";

  const caption = document.createElement("figcaption");

  figure.append(area, caption);

  const chapter = document.getElementById("chapter");
  chapter.before(figure);

  let currentImage = "";
  let requestNumber = 0;

  function showPlaceholder(message) {
    const text = document.createElement("div");
    text.className = "scene-placeholder";
    text.textContent = message;
    area.replaceChildren(text);
  }

  function updateSceneArt() {
    const imageName = state.ending
      ? endingImages[state.ending]
      : sceneImages[state.node];

    const chosen = imageName || "controle";

    caption.textContent = state.ending
      ? `EPÍLOGO · ${ENDINGS[state.ending][0]}`
      : `USINA AURORA · ${SCENES[state.node].location.toUpperCase()}`;

    if (chosen === currentImage) return;

    currentImage = chosen;
    const request = ++requestNumber;
    const path = `${folder}${chosen}.png`;

    showPlaceholder("Carregando cenário…");

    const picture = new Image();
    picture.alt = descriptions[chosen];
    picture.decoding = "async";
    picture.width = 1672;
    picture.height = 941;

    picture.onload = () => {
      // Evita mostrar a imagem anterior se o jogador avançar rápido.
      if (request === requestNumber) {
        area.replaceChildren(picture);
      }
    };

    picture.onerror = () => {
      if (request !== requestNumber) return;

      currentImage = "";
      showPlaceholder(
        `Cenário indisponível: ${path}. Você pode continuar jogando.`
      );
    };

    picture.src = path;
  }

  /* Atualiza o cenário ao escolher, reiniciar ou carregar uma partida */

  const observer = new MutationObserver(updateSceneArt);

  observer.observe(document.getElementById("story-text"), {
    childList: true
  });

  updateSceneArt();

  /* A mesma sala de controle aparece no fundo da tela inicial */

  const cover = new Image();
  const coverPath = `${folder}controle.png`;

  cover.onload = () => {
    document.getElementById("menu").style.backgroundImage =
      `linear-gradient(180deg, rgba(5,8,12,.65), rgba(5,8,12,.9)), ` +
      `url("${coverPath}")`;
  };

  cover.src = coverPath;
})();