// messages/index.ts
// Centralized import of all locale JSON files to avoid runtime dynamic imports
import pt from './pt.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import de from './de.json';

const messages: Record<string, Record<string, any>> = {
  pt,
  en,
  es,
  fr,
  de,
};

export default messages;
