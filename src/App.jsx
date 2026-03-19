import { useState, useEffect, useRef } from "react";

// --- GOOGLE SHEETS CONFIGURATION ---
// Coller ici l'URL de votre Google Apps Script déployé en Application Web
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwg9rKxdU-C1dWuvumUkyrz3QaWyLh2ft-oniO_WRueHDFaa_BZK0P5CLK5wSUBepki/exec";

const BRAND = {
  bg: "#FAF7F2",
  card: "#FFFFFF",
  accent: "#C8963E",
  accentLight: "#E8D5B0",
  accentDark: "#A67A2E",
  text: "#2C2C2C",
  textLight: "#6B6B6B",
  border: "#E8E2D8",
  success: "#4A7C59",
  warning: "#D4A843",
  danger: "#C45C4A",
  dark: "#1A1A1A",
};

const SECTIONS = [
  {
    id: "relation",
    title: "Entrée en relation",
    icon: "🤝",
    description: "Formalisation de la relation contractuelle",
    questions: [
      {
        id: "q1",
        text: "Vos contrats ou CGV sont-ils systématiquement signés avant le début des travaux ou prestations ?",
        options: [
          { label: "Jamais ou rarement", score: 0 },
          { label: "Parfois, selon les clients", score: 1 },
          { label: "La plupart du temps", score: 2 },
          { label: "Toujours, sans exception", score: 3 },
        ],
      },
      {
        id: "q2",
        text: "Disposez-vous d'une « charte de facturation » ou d'un document annexe précisant les exigences de chaque partie (n° de commande, coordonnées bancaires, adresses, etc.) ?",
        options: [
          { label: "Non, aucun document de ce type", score: 0 },
          { label: "Ces infos sont échangées informellement", score: 1 },
          { label: "On a un document mais pas systématiquement utilisé", score: 2 },
          { label: "Oui, signé avec chaque partenaire", score: 3 },
        ],
      },
      {
        id: "q3",
        text: "Les mentions obligatoires de facturation sont-elles clairement communiquées à vos partenaires commerciaux ?",
        options: [
          { label: "On ne s'en préoccupe pas", score: 0 },
          { label: "On corrige quand il y a un problème", score: 1 },
          { label: "On les rappelle dans nos CGV", score: 2 },
          { label: "Elles sont détaillées et partagées en amont", score: 3 },
        ],
      },
    ],
  },
  {
    id: "commande",
    title: "Formalisation commande",
    icon: "📋",
    description: "Bon de commande et traçabilité",
    questions: [
      {
        id: "q4",
        text: "Un bon de commande (ou devis signé) est-il émis avant chaque prestation ou livraison ?",
        options: [
          { label: "Rarement, on travaille souvent sur accord verbal", score: 0 },
          { label: "Pour les gros chantiers uniquement", score: 1 },
          { label: "Dans la majorité des cas", score: 2 },
          { label: "Systématiquement, c'est un prérequis", score: 3 },
        ],
      },
      {
        id: "q5",
        text: "Le bon de commande mentionne-t-il clairement l'entité à facturer, l'adresse d'envoi de la facture et un contact chez le client ?",
        options: [
          { label: "Non, ces informations manquent souvent", score: 0 },
          { label: "Parfois, ça dépend du client", score: 1 },
          { label: "Généralement oui, mais pas toujours complet", score: 2 },
          { label: "Oui, toujours complet et vérifié", score: 3 },
        ],
      },
    ],
  },
  {
    id: "validation",
    title: "Validation prestation",
    icon: "✅",
    description: "Vérification, réception et bon à payer",
    questions: [
      {
        id: "q6",
        text: "La durée et les modalités de vérification/réception des prestations sont-elles définies contractuellement ?",
        options: [
          { label: "Non, rien de formalisé", score: 0 },
          { label: "C'est implicite mais pas écrit", score: 1 },
          { label: "Prévu dans certains contrats", score: 2 },
          { label: "Systématiquement prévu et respecté", score: 3 },
        ],
      },
      {
        id: "q7",
        text: "Des interlocuteurs dédiés sont-ils identifiés (côté client ET fournisseur) pour le suivi de la validation ?",
        options: [
          { label: "Non, ça dépend de qui est disponible", score: 0 },
          { label: "Côté fournisseur oui, côté client c'est flou", score: 1 },
          { label: "Généralement oui des deux côtés", score: 2 },
          { label: "Toujours, avec coordonnées dans le contrat", score: 3 },
        ],
      },
      {
        id: "q8",
        text: "Avez-vous un processus formalisé de « bon à payer » dès la réception conforme ?",
        options: [
          { label: "Non, pas de processus formel", score: 0 },
          { label: "Un accord oral ou par mail", score: 1 },
          { label: "Un processus existe mais pas toujours respecté", score: 2 },
          { label: "Oui, automatisé dans notre système d'information", score: 3 },
        ],
      },
      {
        id: "q9",
        text: "Pour vos marchés de travaux : vérifiez-vous systématiquement la légalité des conditions de règlement imposées (dates limites, retenues, plafonds) ?",
        options: [
          { label: "Non, on accepte ce qu'on nous impose", score: 0 },
          { label: "On vérifie quand ça semble abusif", score: 1 },
          { label: "On vérifie régulièrement", score: 2 },
          { label: "Oui, avec un contrôle juridique systématique", score: 3 },
        ],
      },
    ],
  },
  {
    id: "facturation",
    title: "Réception facture",
    icon: "🧾",
    description: "Émission, réception et enregistrement",
    questions: [
      {
        id: "q10",
        text: "Utilisez-vous une facture type standardisée reprenant toutes les mentions obligatoires ?",
        options: [
          { label: "Non, chaque facture est faite manuellement", score: 0 },
          { label: "On a un modèle mais il n'est pas toujours utilisé", score: 1 },
          { label: "Oui, un modèle standard pour la plupart des cas", score: 2 },
          { label: "Oui, intégré dans notre logiciel de facturation", score: 3 },
        ],
      },
      {
        id: "q11",
        text: "Vos factures sont-elles émises et envoyées immédiatement après la réalisation de la prestation ?",
        options: [
          { label: "Non, on facture en fin de mois ou avec du retard", score: 0 },
          { label: "Sous une à deux semaines", score: 1 },
          { label: "Sous quelques jours", score: 2 },
          { label: "Le jour même ou le lendemain", score: 3 },
        ],
      },
      {
        id: "q12",
        text: "Votre référentiel fournisseurs/clients est-il à jour (coordonnées bancaires, adresses, entités) ?",
        options: [
          { label: "On n'a pas de référentiel centralisé", score: 0 },
          { label: "Il existe mais rarement mis à jour", score: 1 },
          { label: "Mis à jour ponctuellement", score: 2 },
          { label: "Mis à jour en continu, processus en place", score: 3 },
        ],
      },
      {
        id: "q13",
        text: "Êtes-vous préparé à l'obligation de facturation électronique ?",
        options: [
          { label: "Pas du tout, on n'a pas encore regardé", score: 0 },
          { label: "On en a entendu parler mais rien de concret", score: 1 },
          { label: "On a commencé à se renseigner/former", score: 2 },
          { label: "Oui, solution choisie et en cours de déploiement", score: 3 },
        ],
      },
    ],
  },
  {
    id: "paiement",
    title: "Mise en paiement",
    icon: "💶",
    description: "Organisation du règlement",
    questions: [
      {
        id: "q14",
        text: "Combien de campagnes de paiement réalisez-vous par mois ?",
        options: [
          { label: "Une seule fois par mois", score: 0 },
          { label: "Deux fois par mois", score: 1 },
          { label: "Hebdomadaire", score: 2 },
          { label: "En continu ou quasi quotidien", score: 3 },
        ],
      },
      {
        id: "q15",
        text: "Quel est votre mode de paiement principal pour vos fournisseurs ?",
        options: [
          { label: "Chèque", score: 0 },
          { label: "Virement classique à échéance", score: 1 },
          { label: "Virement commercial programmé", score: 2 },
          { label: "Virement instantané ou carte d'achat", score: 3 },
        ],
      },
      {
        id: "q16",
        text: "En cas de retard de paiement, versez-vous automatiquement les intérêts moratoires (obligation légale L.441-10) ?",
        options: [
          { label: "Jamais, on ne connaissait même pas cette obligation", score: 0 },
          { label: "Uniquement si le fournisseur les réclame", score: 1 },
          { label: "On essaie de les appliquer", score: 2 },
          { label: "Oui, c'est automatisé dans notre processus", score: 3 },
        ],
      },
      {
        id: "q17",
        text: "Avez-vous une procédure de relance formalisée pour les factures impayées ?",
        options: [
          { label: "Non, on relance quand on y pense", score: 0 },
          { label: "On relance manuellement au cas par cas", score: 1 },
          { label: "On a un calendrier de relance défini", score: 2 },
          { label: "Relances automatisées avec escalade", score: 3 },
        ],
      },
    ],
  },
];

const TOTAL_MAX = SECTIONS.reduce(
  (acc, s) => acc + s.questions.length * 3,
  0
);

function getLevel(pct) {
  if (pct >= 80) return { label: "Excellent", color: BRAND.success, emoji: "🏆" };
  if (pct >= 60) return { label: "Bon niveau", color: BRAND.accent, emoji: "👍" };
  if (pct >= 40) return { label: "À améliorer", color: BRAND.warning, emoji: "⚠️" };
  return { label: "Critique", color: BRAND.danger, emoji: "🚨" };
}

function getSectionAdvice(sectionId, pct) {
  const advice = {
    relation: {
      low: "Vos relations contractuelles manquent de formalisme. Chaque prestation sans contrat signé est un risque de retard de paiement. Mettre en place une charte de facturation signée avec chaque partenaire réduirait significativement vos litiges.",
      mid: "Les bases sont là mais le formalisme n'est pas systématique. Standardisez vos documents d'entrée en relation pour couvrir 100% de vos partenaires.",
      high: "Votre formalisation contractuelle est solide. Continuez à maintenir ce niveau d'exigence.",
    },
    commande: {
      low: "L'absence de bons de commande formalisés est l'une des causes principales de retards de paiement. C'est le point à traiter en priorité.",
      mid: "Bonne dynamique, mais les exceptions (petits chantiers, clients historiques) créent des failles. Visez le 100%.",
      high: "Votre processus de commande est bien structuré.",
    },
    validation: {
      low: "Sans processus clair de validation et de « bon à payer », chaque facture devient un sujet de négociation. C'est un levier d'amélioration majeur pour votre trésorerie.",
      mid: "Les processus existent mais manquent de rigueur. L'automatisation du bon à payer dans votre SI serait un gain rapide.",
      high: "Vos processus de validation sont matures.",
    },
    facturation: {
      low: "Des factures tardives, non standardisées et un référentiel non tenu sont des générateurs de retards. La facturation électronique va rendre ce sujet encore plus critique.",
      mid: "Vous êtes sur la bonne voie. Priorisez la préparation à la facturation électronique et l'émission immédiate des factures.",
      high: "Votre gestion de la facturation est bien rodée. Vous êtes en bonne position pour la transition électronique.",
    },
    paiement: {
      low: "Votre organisation de paiement génère des retards structurels. Augmenter la fréquence des campagnes et passer au virement commercial sont des quick wins.",
      mid: "Des progrès sont possibles sur l'automatisation des relances et le versement des intérêts moratoires.",
      high: "Votre organisation de paiement est efficace.",
    },
  };
  const key = pct < 40 ? "low" : pct < 70 ? "mid" : "high";
  return advice[sectionId]?.[key] || "";
}

// --- COMPONENTS ---

function ProgressBar({ current, total }) {
  const pct = ((current) / total) * 100;
  return (
    <div style={{ width: "100%", height: 4, background: BRAND.border, borderRadius: 2 }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${BRAND.accent}, ${BRAND.accentDark})`,
          borderRadius: 2,
          transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </div>
  );
}

function RadarChart({ scores, size = 280 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = scores.length;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (i, val) => {
    const angle = angleStep * i - Math.PI / 2;
    return {
      x: cx + r * val * Math.cos(angle),
      y: cy + r * val * Math.sin(angle),
    };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = scores.map((s, i) => getPoint(i, s.pct / 100));
  const pathD = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: size }}>
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, level));
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
        return <path key={level} d={d} fill="none" stroke={BRAND.border} strokeWidth={1} />;
      })}
      {scores.map((_, i) => {
        const p = getPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={BRAND.border} strokeWidth={0.5} />;
      })}
      <path d={pathD} fill={BRAND.accent + "30"} stroke={BRAND.accent} strokeWidth={2.5} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={BRAND.accent} stroke="#fff" strokeWidth={2} />
      ))}
      {scores.map((s, i) => {
        const p = getPoint(i, 1.18);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: 11, fill: BRAND.text, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
          >
            {s.icon}
          </text>
        );
      })}
    </svg>
  );
}

function WelcomeScreen({ onStart }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 28,
          fontWeight: 700,
          color: BRAND.text,
          marginBottom: 8,
          lineHeight: 1.2,
        }}
      >
        Auto-diagnostic
        <br />
        <span style={{ color: BRAND.accent }}>Délais de paiement</span>
      </h1>
      <p style={{ color: BRAND.textLight, fontSize: 15, maxWidth: 420, margin: "0 auto 8px", lineHeight: 1.5 }}>
        Évaluez vos pratiques en 5 minutes et identifiez vos leviers d'amélioration pour réduire les retards de paiement.
      </p>
      <p style={{ color: BRAND.textLight, fontSize: 13, marginBottom: 28, opacity: 0.7 }}>
        Basé sur le Guide des bonnes pratiques de l'Observatoire des délais de paiement (Banque de France, 2024)
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 32,
        }}
      >
        {SECTIONS.map((s) => (
          <div
            key={s.id}
            style={{
              background: BRAND.card,
              border: `1px solid ${BRAND.border}`,
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              color: BRAND.text,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{s.icon}</span>
            <span style={{ fontWeight: 500 }}>{s.title}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        style={{
          background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accentDark})`,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "14px 40px",
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: `0 4px 16px ${BRAND.accent}40`,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = `0 6px 24px ${BRAND.accent}60`;
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = `0 4px 16px ${BRAND.accent}40`;
        }}
      >
        Commencer le diagnostic →
      </button>
      <p style={{ fontSize: 12, color: BRAND.textLight, marginTop: 12, opacity: 0.6 }}>
        17 questions · ~5 min · 100% gratuit
      </p>
    </div>
  );
}

function QuestionScreen({ section, questionIndex, question, totalQuestions, currentGlobal, onAnswer, onBack }) {
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);

  const handleSelect = (optIndex) => {
    setSelected(optIndex);
    setAnimating(true);
    setTimeout(() => {
      onAnswer(question.id, question.options[optIndex].score);
      setSelected(null);
      setAnimating(false);
    }, 350);
  };

  return (
    <div style={{ opacity: animating ? 0.5 : 1, transition: "opacity 0.3s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 20 }}>{section.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: BRAND.accent, textTransform: "uppercase", letterSpacing: 1 }}>
          {section.title}
        </span>
      </div>

      <ProgressBar current={currentGlobal} total={totalQuestions} />

      <p style={{ fontSize: 12, color: BRAND.textLight, marginTop: 8, marginBottom: 20 }}>
        Question {currentGlobal + 1} sur {totalQuestions}
      </p>

      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20,
          fontWeight: 600,
          color: BRAND.text,
          lineHeight: 1.4,
          marginBottom: 24,
        }}
      >
        {question.text}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            style={{
              background: selected === i ? BRAND.accent + "15" : BRAND.card,
              border: `2px solid ${selected === i ? BRAND.accent : BRAND.border}`,
              borderRadius: 12,
              padding: "14px 16px",
              textAlign: "left",
              cursor: "pointer",
              fontSize: 14,
              color: BRAND.text,
              fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1.4,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
            onMouseEnter={(e) => {
              if (selected !== i) e.target.style.borderColor = BRAND.accentLight;
            }}
            onMouseLeave={(e) => {
              if (selected !== i) e.target.style.borderColor = BRAND.border;
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                minWidth: 28,
                borderRadius: "50%",
                border: `2px solid ${selected === i ? BRAND.accent : BRAND.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: selected === i ? BRAND.accent : BRAND.textLight,
                background: selected === i ? BRAND.accent + "20" : "transparent",
                transition: "all 0.2s",
              }}
            >
              {String.fromCharCode(65 + i)}
            </span>
            {opt.label}
          </button>
        ))}
      </div>

      {currentGlobal > 0 && (
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: BRAND.textLight,
            fontSize: 13,
            cursor: "pointer",
            marginTop: 16,
            padding: "4px 8px",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          ← Revenir à la question précédente
        </button>
      )}
    </div>
  );
}

function ContactForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ nom: "", entreprise: "", email: "", telephone: "", taille: "", role: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.nom.trim()) e.nom = true;
    if (!form.entreprise.trim()) e.entreprise = true;
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit(form);
  };

  const inputStyle = (field) => ({
    width: "100%",
    padding: "12px 14px",
    border: `2px solid ${errors[field] ? BRAND.danger : BRAND.border}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: BRAND.text,
    background: BRAND.card,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  });

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: BRAND.text, marginBottom: 8 }}>
          Votre diagnostic est prêt
        </h2>
        <p style={{ color: BRAND.textLight, fontSize: 14, lineHeight: 1.5 }}>
          Renseignez vos coordonnées pour recevoir votre rapport détaillé avec les recommandations personnalisées.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.textLight, marginBottom: 4, display: "block" }}>
              Nom / Prénom *
            </label>
            <input
              style={inputStyle("nom")}
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Jean Dupont"
              onFocus={(e) => (e.target.style.borderColor = BRAND.accent)}
              onBlur={(e) => (e.target.style.borderColor = errors.nom ? BRAND.danger : BRAND.border)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.textLight, marginBottom: 4, display: "block" }}>
              Entreprise *
            </label>
            <input
              style={inputStyle("entreprise")}
              value={form.entreprise}
              onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
              placeholder="Mon Entreprise BTP"
              onFocus={(e) => (e.target.style.borderColor = BRAND.accent)}
              onBlur={(e) => (e.target.style.borderColor = errors.entreprise ? BRAND.danger : BRAND.border)}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.textLight, marginBottom: 4, display: "block" }}>
            Email professionnel *
          </label>
          <input
            style={inputStyle("email")}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="jean@monentreprise.fr"
            onFocus={(e) => (e.target.style.borderColor = BRAND.accent)}
            onBlur={(e) => (e.target.style.borderColor = errors.email ? BRAND.danger : BRAND.border)}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.textLight, marginBottom: 4, display: "block" }}>
              Téléphone
            </label>
            <input
              style={inputStyle("telephone")}
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              placeholder="06 12 34 56 78"
              onFocus={(e) => (e.target.style.borderColor = BRAND.accent)}
              onBlur={(e) => (e.target.style.borderColor = BRAND.border)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.textLight, marginBottom: 4, display: "block" }}>
              Taille entreprise
            </label>
            <select
              style={{ ...inputStyle("taille"), appearance: "auto" }}
              value={form.taille}
              onChange={(e) => setForm({ ...form, taille: e.target.value })}
            >
              <option value="">Sélectionnez</option>
              <option value="1-10">1 à 10 salariés</option>
              <option value="11-50">11 à 50 salariés</option>
              <option value="51-200">51 à 200 salariés</option>
              <option value="200+">Plus de 200 salariés</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.textLight, marginBottom: 4, display: "block" }}>
            Votre fonction
          </label>
          <select
            style={{ ...inputStyle("role"), appearance: "auto" }}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="">Sélectionnez</option>
            <option value="dirigeant">Dirigeant / Gérant</option>
            <option value="daf">DAF / Responsable financier</option>
            <option value="comptable">Comptable</option>
            <option value="conducteur">Conducteur de travaux</option>
            <option value="charge_affaires">Chargé d'affaires</option>
            <option value="autre">Autre</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: 20,
          background: loading ? BRAND.textLight : `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accentDark})`,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "14px",
          fontSize: 15,
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: `0 4px 16px ${BRAND.accent}40`,
        }}
      >
        {loading ? "Envoi en cours..." : "Voir mon diagnostic →"}
      </button>

      <p style={{ fontSize: 11, color: BRAND.textLight, textAlign: "center", marginTop: 10, opacity: 0.6 }}>
        Vos données restent confidentielles. Aucun spam.
      </p>
    </div>
  );
}

function ResultsScreen({ answers, contact, onRestart }) {
  const sectionScores = SECTIONS.map((section) => {
    const max = section.questions.length * 3;
    const score = section.questions.reduce((acc, q) => acc + (answers[q.id] || 0), 0);
    const pct = Math.round((score / max) * 100);
    return { ...section, score, max, pct };
  });

  const totalScore = sectionScores.reduce((a, s) => a + s.score, 0);
  const totalPct = Math.round((totalScore / TOTAL_MAX) * 100);
  const level = getLevel(totalPct);

  const weakest = [...sectionScores].sort((a, b) => a.pct - b.pct).slice(0, 2);

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 44, marginBottom: 4 }}>{level.emoji}</div>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 24,
            color: BRAND.text,
            marginBottom: 4,
          }}
        >
          Score global : <span style={{ color: level.color }}>{totalPct}%</span>
        </h2>
        <p style={{ fontSize: 16, fontWeight: 600, color: level.color, marginBottom: 4 }}>{level.label}</p>
        <p style={{ fontSize: 13, color: BRAND.textLight }}>
          {contact.nom}, voici le diagnostic de {contact.entreprise}
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <RadarChart
          scores={sectionScores.map((s) => ({ pct: s.pct, icon: s.icon }))}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 }}>
        {sectionScores.map((s) => {
          const lvl = getLevel(s.pct);
          return (
            <div
              key={s.id}
              style={{
                background: BRAND.card,
                border: `1px solid ${BRAND.border}`,
                borderRadius: 10,
                padding: "8px 12px",
                textAlign: "center",
                minWidth: 100,
                flex: "1 1 auto",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: BRAND.textLight, marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: lvl.color }}>{s.pct}%</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: BRAND.text, marginBottom: 12 }}>
          Axes d'amélioration prioritaires
        </h3>
        {weakest.map((s) => (
          <div
            key={s.id}
            style={{
              background: BRAND.card,
              border: `1px solid ${BRAND.border}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <span style={{ fontWeight: 600, color: BRAND.text, fontSize: 14 }}>{s.title}</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 13,
                  fontWeight: 700,
                  color: getLevel(s.pct).color,
                }}
              >
                {s.pct}%
              </span>
            </div>
            <p style={{ fontSize: 13, color: BRAND.textLight, lineHeight: 1.5, margin: 0 }}>
              {getSectionAdvice(s.id, s.pct)}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          background: `linear-gradient(135deg, ${BRAND.dark}, #2a2520)`,
          borderRadius: 14,
          padding: 20,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <p style={{ color: "#fff", fontSize: 15, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>
          Vous voulez automatiser ces processus et réduire vos délais de paiement ?
        </p>
        <p style={{ color: BRAND.accentLight, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
          Constructech Club accompagne les entreprises BTP dans l'automatisation de leur gestion administrative. 15 min pour voir si on peut vous aider.
        </p>
        <a
          href="https://calendly.com/luca-constructech/30min"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accentDark})`,
            color: "#fff",
            textDecoration: "none",
            borderRadius: 10,
            padding: "12px 28px",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Réserver un créneau gratuit →
        </a>
      </div>

      <button
        onClick={onRestart}
        style={{
          width: "100%",
          background: "none",
          border: `1px solid ${BRAND.border}`,
          borderRadius: 10,
          padding: "10px",
          fontSize: 13,
          color: BRAND.textLight,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Refaire le diagnostic
      </button>
    </div>
  );
}

// --- MAIN APP ---
export default function App() {
  const [screen, setScreen] = useState("welcome"); // welcome | quiz | contact | results
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // Flatten questions
  const allQuestions = SECTIONS.flatMap((s) => s.questions.map((q) => ({ ...q, section: s })));

  const scrollTop = () => {
    if (containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnswer = (qId, score) => {
    setAnswers((prev) => ({ ...prev, [qId]: score }));
    if (currentQ < allQuestions.length - 1) {
      setCurrentQ((c) => c + 1);
    } else {
      setScreen("contact");
    }
    scrollTop();
  };

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ((c) => c - 1);
  };

  const handleContactSubmit = async (form) => {
    setContact(form);
    setLoading(true);

    // Build payload
    const sectionScores = SECTIONS.map((section) => {
      const max = section.questions.length * 3;
      const score = section.questions.reduce((acc, q) => acc + (answers[q.id] || 0), 0);
      return { section: section.id, score, max, pct: Math.round((score / max) * 100) };
    });
    const totalScore = sectionScores.reduce((a, s) => a + s.score, 0);
    const totalPct = Math.round((totalScore / TOTAL_MAX) * 100);

    // Build human-readable answers
    const readableAnswers = SECTIONS.map((section) => {
      const sectionData = sectionScores.find((s) => s.section === section.id);
      const lines = section.questions.map((q) => {
        const selectedScore = answers[q.id] ?? null;
        const selectedOption = q.options.find((o) => o.score === selectedScore);
        return `  ${q.text}\n  → ${selectedOption ? selectedOption.label : "Non répondu"} (${selectedScore ?? "-"}/3)`;
      });
      return `${section.icon} ${section.title} — ${sectionData.pct}%\n${lines.join("\n")}`;
    }).join("\n\n");

    const level = getLevel(totalPct);

    const payload = {
      created_at: new Date().toISOString(),
      nom: form.nom,
      entreprise: form.entreprise,
      email: form.email,
      telephone: form.telephone || "",
      taille: form.taille || "",
      role: form.role || "",
      score_total: totalPct,
      niveau: level.label,
      score_relation: sectionScores.find((s) => s.section === "relation").pct,
      score_commande: sectionScores.find((s) => s.section === "commande").pct,
      score_validation: sectionScores.find((s) => s.section === "validation").pct,
      score_facturation: sectionScores.find((s) => s.section === "facturation").pct,
      score_paiement: sectionScores.find((s) => s.section === "paiement").pct,
      reponses_lisibles: readableAnswers,
      reponses_json: JSON.stringify(answers),
    };

    // --- GOOGLE SHEETS INTEGRATION ---
    // Envoi vers Google Apps Script qui écrit dans le Google Sheet
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Google Sheets error:", err);
      // On affiche quand même les résultats même si l'envoi échoue
    }

    setLoading(false);
    setScreen("results");
    scrollTop();
  };

  const handleRestart = () => {
    setScreen("welcome");
    setAnswers({});
    setCurrentQ(0);
    setContact(null);
    scrollTop();
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"
        rel="stylesheet"
      />
      <div
        ref={containerRef}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: BRAND.bg,
          minHeight: "100vh",
          padding: "24px 16px",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accentDark})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              C
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: BRAND.text }}>Constructech Club</span>
          </div>

          {screen === "welcome" && <WelcomeScreen onStart={() => setScreen("quiz")} />}

          {screen === "quiz" && allQuestions[currentQ] && (
            <QuestionScreen
              section={allQuestions[currentQ].section}
              questionIndex={currentQ}
              question={allQuestions[currentQ]}
              totalQuestions={allQuestions.length}
              currentGlobal={currentQ}
              onAnswer={handleAnswer}
              onBack={handleBack}
            />
          )}

          {screen === "contact" && <ContactForm onSubmit={handleContactSubmit} loading={loading} />}

          {screen === "results" && contact && (
            <ResultsScreen answers={answers} contact={contact} onRestart={handleRestart} />
          )}
        </div>
      </div>
    </>
  );
}
