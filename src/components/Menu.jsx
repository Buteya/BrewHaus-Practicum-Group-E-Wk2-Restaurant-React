import { useState } from 'react'
import { menuCategories } from '../data/menu'

function Menu() {
  const [activeCategory, setActiveCategory] = useState('all')
  const filters = [{ id: 'all', label: 'All' }, ...menuCategories]
  const visibleItems =
    activeCategory === 'all'
      ? menuCategories.flatMap(({ items }) => items)
      : menuCategories.find(({ id }) => id === activeCategory).items

  return (
    <section id="menu" className="border-t border-line px-6 pt-12 pb-16">
      <div className="mx-auto max-w-[1100px]">
        <h2 className="mb-[0.7rem] text-[1.75rem] font-bold">Our Menu</h2>
        <h3 className="mb-4 text-[1.05rem] font-semibold text-[#a5431f]">
          Popular Picks
        </h3>
        <p className="mb-[1.2rem] max-w-[42rem] text-ink-soft">
          Fresh ingredients, expertly crafted dishes, and a warm atmosphere
          designed for memorable moments.
        </p>

        <div
          className="mb-5 flex flex-wrap gap-[10px]"
          role="tablist"
          aria-label="Menu categories"
        >
          {filters.map(({ id, label }) => (
            <button
              key={id}
              id={`menu-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={activeCategory === id}
              aria-controls={`menu-panel-${id}`}
              tabIndex={activeCategory === id ? 0 : -1}
              onClick={() => setActiveCategory(id)}
              className={`rounded-full px-7 py-[0.85rem] font-semibold capitalize transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-accent-hover ${
                activeCategory === id
                  ? 'bg-accent text-white'
                  : 'border border-line bg-white text-ink-soft hover:border-accent-hover hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          id={`menu-panel-${activeCategory}`}
          role="tabpanel"
          aria-labelledby={`menu-tab-${activeCategory}`}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visibleItems.map(({ name, image, description, price }) => (
            <article
              key={name}
              className="overflow-hidden rounded-2xl border border-line transition-shadow duration-150 hover:shadow-[0_8px_24px_rgba(23,54,47,0.1)]"
            >
              <img
                src={image}
                alt={name}
                className="h-[220px] w-full object-cover"
              />
              <div className="p-4">
                <h4 className="mb-1 text-base font-semibold">{name}</h4>
                <p className="text-xs text-ink-soft">{description}</p>
                <p className="mt-2 text-[0.95rem] font-semibold text-accent">
                  {price}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Menu
