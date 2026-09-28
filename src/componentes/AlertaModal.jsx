import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import '../css/alerta-modal.css';

const AlertaContext = createContext(null);

// Referência para permitir chamadas imperativas fora de componentes se necessário
let alertaGlobalHandler = null;

export const alertaGlobal = (opcoesOuMensagem, tipo = 'aviso') => {
  if (alertaGlobalHandler) {
    alertaGlobalHandler(opcoesOuMensagem, tipo);
  } else {
    console.warn('AlertaProvider ainda não foi montado. Mensagem:', opcoesOuMensagem);
  }
};

export function AlertaProvider({ children }) {
  const [alerta, setAlerta] = useState({
    aberto: false,
    titulo: '',
    mensagem: '',
    tipo: 'aviso', // 'sucesso' | 'erro' | 'aviso' | 'info' | 'confirmacao'
    botaoTexto: 'Entendido',
    botaoCancelarTexto: null,
    onConfirmar: null,
    onCancelar: null,
  });

  const fecharAlerta = useCallback(() => {
    setAlerta((prev) => {
      if (prev.onCancelar) {
        try { prev.onCancelar(); } catch (e) { console.error(e); }
      }
      return { ...prev, aberto: false };
    });
  }, []);

  const confirmarAlerta = useCallback(() => {
    setAlerta((prev) => {
      if (prev.onConfirmar) {
        try { prev.onConfirmar(); } catch (e) { console.error(e); }
      }
      return { ...prev, aberto: false };
    });
  }, []);

  const mostrarAlerta = useCallback((opcoesOuMensagem, tipoParam = 'aviso') => {
    let config = {};

    if (typeof opcoesOuMensagem === 'string') {
      const tipo = tipoParam || 'aviso';
      let tituloPadrao = 'Aviso';
      if (tipo === 'sucesso') tituloPadrao = 'Sucesso';
      if (tipo === 'erro') tituloPadrao = 'Atenção';
      if (tipo === 'confirmacao') tituloPadrao = 'Confirmação';

      config = {
        titulo: tituloPadrao,
        mensagem: opcoesOuMensagem,
        tipo,
        botaoTexto: 'Entendido',
        botaoCancelarTexto: null,
        onConfirmar: null,
        onCancelar: null,
      };
    } else if (opcoesOuMensagem && typeof opcoesOuMensagem === 'object') {
      const tipo = opcoesOuMensagem.tipo || 'aviso';
      let tituloPadrao = 'Aviso';
      if (tipo === 'sucesso') tituloPadrao = 'Sucesso';
      if (tipo === 'erro') tituloPadrao = 'Atenção';
      if (tipo === 'confirmacao') tituloPadrao = 'Confirmação';

      config = {
        titulo: opcoesOuMensagem.titulo || tituloPadrao,
        mensagem: opcoesOuMensagem.mensagem || '',
        tipo,
        botaoTexto: opcoesOuMensagem.botaoTexto || (tipo === 'confirmacao' ? 'Confirmar' : 'Entendido'),
        botaoCancelarTexto: opcoesOuMensagem.botaoCancelarTexto || (tipo === 'confirmacao' ? 'Cancelar' : null),
        onConfirmar: opcoesOuMensagem.onConfirmar || null,
        onCancelar: opcoesOuMensagem.onCancelar || null,
      };
    }

    setAlerta({
      aberto: true,
      ...config,
    });
  }, []);

  // Registrar handler global e interceptar window.alert nativo
  useEffect(() => {
    alertaGlobalHandler = mostrarAlerta;

    const alertOriginal = window.alert;
    window.alert = (msg) => {
      mostrarAlerta(String(msg), 'aviso');
    };

    return () => {
      alertaGlobalHandler = null;
      window.alert = alertOriginal;
    };
  }, [mostrarAlerta]);

  // Fechar com ESC ou confirmar com Enter
  useEffect(() => {
    if (!alerta.aberto) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        fecharAlerta();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirmarAlerta();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alerta.aberto, fecharAlerta, confirmarAlerta]);

  return (
    <AlertaContext.Provider value={{ mostrarAlerta, fecharAlerta, alerta }}>
      {children}
      {alerta.aberto && (
        <AlertaModalUI
          alerta={alerta}
          onConfirmar={confirmarAlerta}
          onCancelar={fecharAlerta}
        />
      )}
    </AlertaContext.Provider>
  );
}

export function useAlerta() {
  const context = useContext(AlertaContext);
  if (!context) {
    // Fallback gracioso se usado fora do provider
    return {
      mostrarAlerta: (msg, tipo) => alertaGlobal(msg, tipo),
      fecharAlerta: () => {},
      alerta: { aberto: false },
    };
  }
  return context;
}

function AlertaModalUI({ alerta, onConfirmar, onCancelar }) {
  const modalRef = useRef(null);

  const renderIcone = () => {
    switch (alerta.tipo) {
      case 'sucesso':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="alerta-icone-svg">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        );
      case 'erro':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="alerta-icone-svg">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        );
      case 'confirmacao':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="alerta-icone-svg">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'aviso':
      case 'info':
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="alerta-icone-svg">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
    }
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onCancelar();
    }
  };

  return (
    <div className="alerta-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className={`alerta-caixa alerta-caixa--${alerta.tipo}`} ref={modalRef}>
        <button
          type="button"
          className="alerta-fechar-topo"
          onClick={onCancelar}
          aria-label="Fechar alerta"
        >
          &times;
        </button>

        <div className="alerta-icone-wrap">
          {renderIcone()}
        </div>

        <h3 className="alerta-titulo">{alerta.titulo}</h3>
        <p className="alerta-mensagem">{alerta.mensagem}</p>

        <div className="alerta-acoes">
          {alerta.botaoCancelarTexto && (
            <button
              type="button"
              className="alerta-btn-cancelar"
              onClick={onCancelar}
            >
              {alerta.botaoCancelarTexto}
            </button>
          )}
          <button
            type="button"
            className="alerta-btn-confirmar"
            onClick={onConfirmar}
            autoFocus
          >
            {alerta.botaoTexto}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertaModalUI;
