import heroBurger from '@/assets/hero-burger.jpg';

export function HeroBanner() {
  return (
    <section className="relative h-[400px] md:h-[500px] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBurger})` }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-4 drop-shadow-lg">
          Espaço Imperial
        </h1>
        <p className="text-primary text-xl md:text-2xl lg:text-3xl font-display italic drop-shadow-md">
          Sabores que conquistam
        </p>
      </div>
    </section>
  );
}