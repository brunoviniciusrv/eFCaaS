/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, ShieldCheck, FileText } from 'lucide-react';
import {
  LANDING_LOGO_URL,
  LANDING_BRAND,
  LANDING_NAV,
  LANDING_HERO,
  LANDING_FEATURES,
  LANDING_MISSION,
  LANDING_FOOTER,
  LANDING_MISSION_BG,
} from '../content/landingContent';
import { PricingSection } from './PricingSection';
import styles from './LandingPage.module.css';

const FEATURE_ICONS = {
  triage: Search,
  verification: ShieldCheck,
  editorial: FileText,
} as const;

export function LandingPage() {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.headerLogo} onClick={() => scrollTo('top')}>
          <img src={LANDING_LOGO_URL} alt={LANDING_BRAND.name} className={styles.logoImg} />
        </button>

        <nav className={styles.nav}>
          {LANDING_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.navLink}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.registerBtn}
            onClick={() => navigate('/cadastro-agencia')}
          >
            Cadastrar agência
          </button>
          <button type="button" className={styles.loginBtn} onClick={() => navigate('/login')}>
            Entrar
          </button>
        </div>
      </header>

      <section id="top" className={styles.hero}>
        <div className={styles.heroPattern} />
        <div className={styles.heroDots} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={styles.heroContent}
        >
          <p className={styles.eyebrow}>{LANDING_HERO.eyebrow}</p>
          <h1 className={styles.headline}>{LANDING_HERO.headline}</h1>
          <p className={styles.subheadline}>{LANDING_HERO.subheadline}</p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.ctaPrimary} onClick={() => navigate('/login')}>
              {LANDING_HERO.ctaPrimary}
            </button>
            <button
              type="button"
              className={styles.ctaSecondary}
              onClick={() => navigate('/cadastro-agencia')}
            >
              Cadastrar agência
            </button>
            <button type="button" className={styles.ctaSecondary} onClick={() => scrollTo('recursos')}>
              {LANDING_HERO.ctaSecondary}
            </button>
          </div>
        </motion.div>
      </section>

      <PricingSection />

      <section id="sobre" className={styles.features}>
        <div className={styles.featuresInner}>
          <h2 className={styles.sectionTitle}>
            {LANDING_FEATURES.title}
          </h2>
          <div id="recursos" className={styles.featuresGrid}>
            {LANDING_FEATURES.items.map((feature, idx) => {
              const Icon = FEATURE_ICONS[feature.id as keyof typeof FEATURE_ICONS] ?? Search;
              return (
                <motion.article
                  key={feature.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: idx * 0.1 }}
                  className={styles.featureCard}
                >
                  <div className={styles.featureIcon}>
                    <Icon size={22} />
                  </div>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDesc}>{feature.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.mission}>
        <div
          className={styles.missionBg}
          style={{ backgroundImage: `url(${LANDING_MISSION_BG})` }}
          aria-hidden
        />
        <div className={styles.missionOverlay} aria-hidden />
        <div className={styles.missionInner}>
          <h2 className={styles.missionTitle}>{LANDING_MISSION.title}</h2>
          {LANDING_MISSION.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className={styles.missionText}>
              {paragraph}
            </p>
          ))}
          <div className={styles.missionActions}>
            <button type="button" className={styles.ctaPrimary} onClick={() => navigate('/login')}>
              {LANDING_MISSION.ctaPrimary}
            </button>
            <button type="button" className={styles.ctaSecondary} onClick={() => scrollTo('recursos')}>
              {LANDING_MISSION.ctaSecondary}
            </button>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <img src={LANDING_LOGO_URL} alt={LANDING_BRAND.name} className={styles.footerLogoImg} />
          </div>
          <p className={styles.footerCopyright}>{LANDING_FOOTER.copyright}</p>
          <div className={styles.footerLinks}>
            {LANDING_FOOTER.links.map((link) => (
              <a key={link.label} href={link.href} className={styles.footerLink}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
