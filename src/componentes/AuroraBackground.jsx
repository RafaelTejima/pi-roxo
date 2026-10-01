/**
 * AuroraBackground - Aurora Motion Gradient Mesh
 * Renderiza uma malha animada e lenta de luzes difusas no tema roxo tático (#0b0714, #1b0b30, #723EC3, #b565f2)
 * Totalmente otimizado para GPU (translate3d/will-change) e com suporte a acessibilidade (prefers-reduced-motion).
 */
export default function AuroraBackground() {
  return (
    <div className="aurora-mesh-container" aria-hidden="true">
      <div className="aurora-orb aurora-orb-profundo" />
      <div className="aurora-orb aurora-orb-vibrante" />
      <div className="aurora-orb aurora-orb-neon" />
    </div>
  );
}
