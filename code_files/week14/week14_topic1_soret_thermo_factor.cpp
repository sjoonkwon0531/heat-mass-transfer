// Week 14 · Topic 1 — Coupled fluxes: Soret separation and the thermodynamic factor
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   x_A(L) - x_A(0) ≈ -x_A x_B alpha_A ln(T_L/T_0);  exact: dx/dlnT = -alpha x(1-x)
//   Margules: D* = (1 - 2 A x1 x2) D, negative (uphill diffusion) only if A > 2
// Build: g++ -O2 -std=c++17 week14_topic1_soret_thermo_factor.cpp -o t1 && ./t1
#include <cmath>
#include <cstdio>

double soret_shift(double xA, double alpha, double TL, double T0) { return -xA * (1 - xA) * alpha * std::log(TL / T0); }
double soret_exact(double xA0, double alpha, double TL, double T0) {
  const double r = xA0 / (1 - xA0) * std::pow(T0 / TL, alpha);
  return r / (1 + r);
}
double thermo_factor(double x1, double A) { return 1.0 - 2.0 * A * x1 * (1.0 - x1); }

int main() {
  std::printf("Topic 1 — Soret separation and the thermodynamic factor\n\n");
  std::printf("[1] Lecture example: alpha_A = 0.3, T_L = 300 K, T_0 = 200 K, x_A = x_B = 0.5\n");
  std::printf("   linearised x_A(L) - x_A(0) = %+.4f\n", soret_shift(0.5, 0.3, 300, 200));
  std::printf("   exact (integrated)         = %+.4f\n", soret_exact(0.5, 0.3, 300, 200) - 0.5);
  std::printf("   Sign: with alpha_A > 0 the heavier species A gathers at the cold wall (y = 0).\n\n");
  std::printf("[2] Effect of the temperature ratio (alpha_A = 0.3, x_A = 0.5)\n");
  const double ratios[] = {1.1, 1.5, 2.0, 3.0, 5.0};
  for (double r : ratios) std::printf("   T_L/T_0 = %4.1f   shift = %+.4f\n", r, soret_shift(0.5, 0.3, r, 1.0));
  std::printf("\n");
  std::printf("[3] Cascade: separation factor per stage q = (T_L/T_0)^alpha, n stages -> q^n\n");
  const double q = std::pow(300.0 / 200.0, 0.3);
  const int ns[] = {1, 5, 10, 20, 50};
  for (int n : ns) std::printf("   n = %3d   q^n = %10.3f\n", n, std::pow(q, n));
  std::printf("   (This is why thermal diffusion columns can separate isotopes despite a tiny alpha.)\n\n");
  std::printf("[4] Thermodynamic factor 1 + dln(gamma)/dln(x) for a Margules solution\n");
  std::printf("     x1      A=0.5     A=1.5     A=2.5\n");
  const double xs[] = {0.1, 0.2, 0.3, 0.4, 0.5};
  for (double x : xs) std::printf("   %5.2f   %7.3f   %7.3f   %7.3f\n", x, thermo_factor(x, 0.5), thermo_factor(x, 1.5), thermo_factor(x, 2.5));
  const double A = 2.5, xsp = 0.5 * (1 - std::sqrt(1 - 2 / A));
  std::printf("   For A = %g: D* < 0 for %.3f < x1 < %.3f (spinodal region, uphill diffusion)\n", A, xsp, 1 - xsp);
  return 0;
}
