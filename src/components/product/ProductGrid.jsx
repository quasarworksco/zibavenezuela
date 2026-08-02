import ProductCard from './ProductCard.jsx'
import { GridSkeleton, Empty } from '../ui/State.jsx'

/** Rejilla de productos con sus estados de carga y vacío. */
export default function ProductGrid({
  products,
  loading = false,
  emptyTitle = 'No hay productos',
  emptyText = 'Prueba con otra categoría o ajusta los filtros.',
  skeletonCount = 8,
}) {
  if (loading) return <GridSkeleton count={skeletonCount} />
  if (!products?.length) return <Empty title={emptyTitle} text={emptyText} />

  return (
    <div className="grid">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < 4} />
      ))}
    </div>
  )
}
