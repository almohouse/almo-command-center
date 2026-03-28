export default function Products() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-primary">Product Catalog</h2>
        <p className="text-sm text-on-surface-variant mt-1">Coming soon</p>
      </div>
      <div className="glass-card p-12 flex flex-col items-center justify-center gap-4 text-center">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">inventory_2</span>
        <div>
          <div className="text-sm font-semibold text-primary/60">Product Catalog</div>
          <div className="text-xs text-on-surface-variant mt-1">This page is ready for implementation</div>
        </div>
      </div>
    </div>
  )
}
