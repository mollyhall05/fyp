// Common layout and spacing variables
export const sectionSpacing = {
  py: 'py-12 md:py-16 lg:py-20',
  my: 'my-12 md:my-16 lg:my-20',
  px: 'px-4 sm:px-6 lg:px-8',
};

export const containerSpacing = {
  base: 'max-w-7xl mx-auto',
  narrow: 'max-w-4xl mx-auto',
  wide: 'max-w-[90rem] mx-auto',
};

// Common card styles
export const cardStyles = {
  base: 'rounded-xl border bg-card text-card-foreground shadow-sm transition-all',
  hover: 'hover:shadow-md hover:border-primary/20',
  shadow: 'shadow-soft',
  padding: 'p-6',
};

// Common button styles
export const buttonStyles = {
  base: 'font-medium transition-all duration-200',
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
};

// Common typography styles
export const typography = {
  h1: 'text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl',
  h2: 'text-3xl font-bold tracking-tight sm:text-4xl',
  h3: 'text-2xl font-semibold tracking-tight',
  h4: 'text-xl font-semibold tracking-tight',
  lead: 'text-xl text-muted-foreground',
  paragraph: 'text-base text-muted-foreground',
  small: 'text-sm text-muted-foreground',
};

// Common form styles
export const formStyles = {
  input: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  textarea: 'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  label: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  error: 'text-sm font-medium text-destructive',
};

// Common background styles
export const backgroundStyles = {
  gradient: 'bg-gradient-to-b from-background to-muted/20',
  grid: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-10 dark:opacity-[0.03]',
  card: 'bg-card/50 backdrop-blur-sm',
};
