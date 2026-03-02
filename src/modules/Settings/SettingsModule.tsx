import React from 'react';
import styles from './Settings.module.css';

export function SettingsModule() {
  return (
    <div className={styles.container}>
      <h2>Configurações do Sistema</h2>
      <div className={styles.section}>
        <h3>Geral</h3>
        <p>Opções gerais do SocialOS.</p>
      </div>
      <div className={styles.section}>
        <h3>Aparência</h3>
        <p>Temas, cores e efeitos visuais.</p>
      </div>
      <div className={styles.section}>
        <h3>Privacidade</h3>
        <p>Gerencie quem pode ver suas informações.</p>
      </div>
    </div>
  );
}
