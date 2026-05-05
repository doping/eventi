/**
 * Converte errori tRPC/Zod in messaggi leggibili in italiano.
 * Usare questa funzione in tutti gli onError delle mutation.
 */
export function getErrorMessage(err: unknown): string {
  if (!err) return "Si è verificato un errore imprevisto.";

  const error = err as { message?: string; data?: { zodError?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] } } };

  // Zod validation errors — extract field-level messages
  if (error?.data?.zodError) {
    const fieldErrors = error.data.zodError.fieldErrors;
    const formErrors = error.data.zodError.formErrors;

    const messages: string[] = [];

    if (fieldErrors) {
      for (const [field, errors] of Object.entries(fieldErrors)) {
        if (errors && errors.length > 0) {
          // Use the custom Italian message if set, otherwise generate a generic one
          const msg = errors[0];
          if (isItalianMessage(msg)) {
            messages.push(msg);
          } else {
            messages.push(fieldToItalian(field, msg));
          }
        }
      }
    }

    if (formErrors && formErrors.length > 0) {
      messages.push(...formErrors);
    }

    if (messages.length > 0) {
      return messages.join("\n");
    }
  }

  // Generic tRPC error message — translate common English patterns
  if (error?.message) {
    return translateMessage(error.message);
  }

  return "Si è verificato un errore imprevisto.";
}

function isItalianMessage(msg: string): boolean {
  // Heuristic: if it contains Italian words, it's already translated
  const italianWords = ["obbligatorio", "obbligatoria", "seleziona", "inserisci", "minimo", "massimo", "valido", "valida"];
  return italianWords.some(w => msg.toLowerCase().includes(w));
}

function fieldToItalian(field: string, originalMsg: string): string {
  const fieldNames: Record<string, string> = {
    title: "Titolo",
    description: "Descrizione",
    category: "Categoria",
    eventDate: "Data evento",
    eventEndDate: "Data fine evento",
    venueName: "Nome venue",
    venueAddress: "Indirizzo",
    venueCity: "Città",
    imageUrl: "Immagine",
    price: "Prezzo",
    quantity: "Quantità",
    name: "Nome",
    email: "Email",
    country: "Paese",
    message: "Messaggio",
    rating: "Valutazione",
    comment: "Commento",
  };

  const fieldLabel = fieldNames[field] || field;

  if (originalMsg.includes("too_small") || originalMsg.includes("Required") || originalMsg.includes("min")) {
    return `Il campo "${fieldLabel}" è obbligatorio`;
  }
  if (originalMsg.includes("too_big") || originalMsg.includes("max")) {
    return `Il campo "${fieldLabel}" supera la lunghezza massima consentita`;
  }
  if (originalMsg.includes("invalid_type")) {
    return `Il campo "${fieldLabel}" non è valido`;
  }
  if (originalMsg.includes("invalid_string") || originalMsg.includes("email")) {
    return `Il campo "${fieldLabel}" non è un indirizzo email valido`;
  }

  return `Il campo "${fieldLabel}" non è valido`;
}

function translateMessage(msg: string): string {
  const translations: Record<string, string> = {
    "Not authorized": "Non sei autorizzato a eseguire questa operazione.",
    "Forbidden": "Accesso negato.",
    "Not found": "Elemento non trovato.",
    "Event not found": "Evento non trovato.",
    "Order not found": "Ordine non trovato.",
    "Ticket not found": "Biglietto non trovato.",
    "Already validated": "Questo biglietto è già stato validato.",
    "Internal server error": "Errore interno del server. Riprova più tardi.",
    "Unauthorized": "Devi effettuare il login per continuare.",
    "Too many requests": "Troppe richieste. Attendi qualche secondo e riprova.",
    "Network error": "Errore di rete. Controlla la connessione e riprova.",
  };

  for (const [en, it] of Object.entries(translations)) {
    if (msg.toLowerCase().includes(en.toLowerCase())) {
      return it;
    }
  }

  // If already in Italian, return as-is
  if (isItalianMessage(msg)) return msg;

  return msg;
}
