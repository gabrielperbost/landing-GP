import type { Metadata } from "next";
import Image from "next/image";
import { PER_STRATEGY } from "@/content/perStrategy";
import { LEGAL } from "@/content/site";
import styles from "./strategie-per.module.css";

export const metadata: Metadata = {
  title: "Votre stratégie PER : impôt et retraite | GP Finances",
  description:
    "Découvrez comment le Plan Épargne Retraite peut vous aider à réduire votre impôt et à préparer votre retraite. Réservez votre échange offert avec Gabriel Perbost.",
  alternates: { canonical: "/strategie-per" },
  openGraph: {
    title: "Votre stratégie PER | GP Finances",
    description: "Comprendre le PER et faire le point sur votre situation avec Gabriel Perbost.",
    url: "https://gp-finances.fr/strategie-per",
    siteName: "GP Finances",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/images/gabriel-perbost-per-v4.png", width: 560, height: 560 }]
  }
};

export default function PerStrategyPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="per-strategy-title">
        <h1 id="per-strategy-title" className={styles.title}>
          <span>Découvrez comment le <strong>PER</strong> peut vous aider à</span>{" "}
          <span><strong>réduire votre impôt</strong> et <strong>préparer votre retraite</strong> <span className={styles.arrow} aria-hidden="true">▼</span></span>
        </h1>

        <div className={styles.videoFrame}>
          {PER_STRATEGY.video.src ? (
            <video
              className={styles.video}
              src={PER_STRATEGY.video.src}
              poster={PER_STRATEGY.video.poster || undefined}
              controls
              playsInline
              preload="metadata"
              aria-label="Présentation du Plan Épargne Retraite par Gabriel Perbost"
            >
              Votre navigateur ne permet pas de lire cette vidéo. <a href={PER_STRATEGY.video.src}>Ouvrir la vidéo</a>.
            </video>
          ) : (
            <div className={styles.placeholder} aria-label="Présentation vidéo sur le PER, bientôt disponible">
              <div className={styles.portrait}>
                <Image
                  src="/images/gabriel-perbost-per-v4.png"
                  alt="Gabriel Perbost, GP Finances"
                  fill
                  priority
                  sizes="(max-width: 640px) 32vw, 350px"
                  className={styles.portraitImage}
                />
                <div className={styles.speaker}>
                  <span>Gabriel Perbost</span>
                  <span>GP FINANCES</span>
                </div>
              </div>
              <div className={styles.slide}>
                <div className={styles.slideContent}>
                  <p className={styles.slideEyebrow}>PLAN ÉPARGNE RETRAITE</p>
                  <p className={styles.slideTitle}>Votre impôt.<br />Votre retraite.<br /><span>Votre stratégie.</span></p>
                  <span className={styles.playSymbol} aria-hidden="true">
                    <svg viewBox="0 0 48 48" fill="none"><path d="M17 11L37 24L17 37V11Z" fill="currentColor" /></svg>
                  </span>
                  <p className={styles.comingSoon}>La vidéo arrive bientôt</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.booking}>
          <a
            id="strategie-per-book-call"
            href={PER_STRATEGY.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cta}
          >
            Réservez votre appel offert
          </a>
          <p className={styles.reassurance}>Avec Gabriel Perbost · Gratuit et sans engagement</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <p className={styles.disclosure}>
          L’avantage fiscal dépend de votre situation et des plafonds applicables. L’épargne est en principe bloquée
          jusqu’à la retraite, sauf cas de déblocage anticipé prévus par la loi.
        </p>
        <div className={styles.footerLinks}>
          <span>{LEGAL.company} · {LEGAL.orias}</span>
          <details className={styles.legal}>
            <summary>Mentions légales</summary>
            <p>{LEGAL.company} · {LEGAL.status}<br />{LEGAL.rcs} · {LEGAL.orias}<br />Siège social : {LEGAL.hq}</p>
          </details>
          <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F36526/0" target="_blank" rel="noopener noreferrer">Comprendre le PER</a>
        </div>
      </footer>
    </main>
  );
}
