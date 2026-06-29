/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Database, Lock } from 'lucide-react';
import { LANDING_PRICING } from '../content/landingContent';
import styles from './PricingSection.module.css';

export function PricingSection() {
  const navigate = useNavigate();
  const { free, paid } = LANDING_PRICING.plans;

  const goToRegistration = (plan: 'FREE' | 'PAID') => {
    navigate(`/cadastro-agencia?plano=${plan}`);
  };

  return (
    <section id="planos" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h2 className={styles.title}>{LANDING_PRICING.title}</h2>
          <p className={styles.subtitle}>{LANDING_PRICING.subtitle}</p>
        </div>

        <div className={styles.grid}>
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className={styles.card}
          >
            <div className={styles.cardBadge}>
              <Database size={14} />
              {free.badge}
            </div>
            <h3 className={styles.planName}>{free.name}</h3>
            <p className={styles.price}>{free.price}</p>
            <p className={styles.priceNote}>{free.priceNote}</p>
            <p className={styles.description}>{free.description}</p>
            <ul className={styles.featureList}>
              {free.highlights.map((item) => (
                <li key={item} className={styles.featureItem}>
                  <Check size={16} className={styles.featureIcon} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={styles.ctaPrimary}
              onClick={() => goToRegistration('FREE')}
            >
              {free.cta}
            </button>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: 0.1 }}
            className={`${styles.card} ${styles.cardPaid}`}
          >
            <div className={`${styles.cardBadge} ${styles.cardBadgePaid}`}>
              <Lock size={14} />
              {paid.badge}
            </div>
            <h3 className={styles.planName}>{paid.name}</h3>
            <p className={styles.price}>{paid.price}</p>
            <p className={styles.description}>{paid.description}</p>
            {paid.highlights.length > 0 && (
              <ul className={styles.featureList}>
                {paid.highlights.map((item) => (
                  <li key={item} className={styles.featureItem}>
                    <Check size={16} className={styles.featureIconPaid} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className={styles.ctaSecondary}
              onClick={() => goToRegistration('PAID')}
            >
              {paid.cta}
            </button>
          </motion.article>
        </div>

        <div className={styles.dataSharingBox}>
          <h3 className={styles.dataSharingTitle}>{LANDING_PRICING.dataSharingTitle}</h3>
          <ul className={styles.dataSharingList}>
            {LANDING_PRICING.dataSharingBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
