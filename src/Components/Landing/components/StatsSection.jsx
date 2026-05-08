import { Card, CardContent } from "../ui/card";

const stats = [
  {
    number: "500+",
    label: "Companies Trust Us",
    description: "Growing businesses worldwide"
  },
  {
    number: "98%",
    label: "Customer Satisfaction",
    description: "Based on user feedback"
  },
  {
    number: "50%",
    label: "Time Savings",
    description: "On HR administrative tasks"
  },
  {
    number: "24/7",
    label: "Platform Availability",
    description: "Reliable cloud infrastructure"
  }
];

const StatsSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-[var(--color-primary-lightest)] to-[var(--color-bg-secondary-30)]">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)]">
            Trusted by Industry Leaders
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Join thousands of companies that have transformed their HR operations with our platform
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-[var(--color-border-primary)]/50 bg-[var(--color-bg-card)]/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 space-y-3">
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-darker)] bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {stat.label}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;