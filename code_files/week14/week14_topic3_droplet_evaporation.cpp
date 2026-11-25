// Week 14 · Topic 3 — Simultaneous heat and mass transfer: a water droplet evaporating in N2
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   (1 - x_inf)/(1 - x_R) = [1 + c_pW (T_inf - T_R)/lambda]^(a*),  a* = k_G/(C c_pW D),  x_R = p_sat(T_R)/P
//   d^2 law: t_life = C_L R0^2 / (2 C D ln[(1 - x_inf)/(1 - x_R)])
// Build: g++ -O2 -std=c++17 week14_topic3_droplet_evaporation.cpp -o t3 && ./t3
#include <cmath>
#include <cstdio>

const double P = 101325.0, RG = 8.314;
const double kG = 0.026, D = 2.6e-5, cpW = 34.0, lam = 44000.0, CL = 55500.0;
const double C = P / (RG * 298.15);

double psat(double Tc) { return 611.21 * std::exp((18.678 - Tc / 234.5) * (Tc / (257.14 + Tc))); }

void surface_state(double Tinf, double xinf, double& TR, double& xR) {
  const double a = kG / (C * cpW * D);
  auto f = [&](double T) { return std::log((1 - xinf) / (1 - psat(T) / P)) - a * std::log(1 + cpW * (Tinf - T) / lam); };
  double lo = -40.0, hi = std::fmin(Tinf, 99.9);
  for (int i = 0; i < 200; ++i) {
    const double mid = 0.5 * (lo + hi);
    if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid;
  }
  TR = 0.5 * (lo + hi);
  xR = psat(TR) / P;
}

int main() {
  std::printf("Topic 3 — water droplet evaporating in N2 (pseudo-steady, stagnant gas)\n\n");
  std::printf("   k_G = %g, D = %.1e, c_pW = %.1f, lambda = %.0f J/mol, C = %.2f mol/m3\n", kG, D, cpW, lam, C);
  std::printf("   a* = k_G/(C c_pW D) = %.3f\n\n", kG / (C * cpW * D));
  std::printf("[1] Surface temperature and vapor fraction (dry N2, x_W,inf = 0)\n");
  std::printf("   T_inf (C)   T(R) (C)   x_W(R)     lifetime of a 100 um droplet (s)\n");
  const double Ts[] = {25, 50, 100, 150, 200};
  for (double Tinf : Ts) {
    double TR, xR;
    surface_state(Tinf, 0.0, TR, xR);
    const double tl = CL * 50e-6 * 50e-6 / (2 * C * D * std::log(1 / (1 - xR)));
    std::printf("   %7.0f    %8.2f   %.5f    %8.2f\n", Tinf, TR, xR, tl);
  }
  std::printf("\n");
  std::printf("[2] Humid gas at 25 C: the surface warms toward T_inf as x_W,inf rises\n");
  const double xis[] = {0.0, 0.01, 0.02, 0.03};
  for (double xi : xis) {
    double TR, xR;
    surface_state(25.0, xi, TR, xR);
    std::printf("   x_W,inf = %.2f   T(R) = %6.2f C   x_W(R) = %.5f\n", xi, TR, xR);
  }
  std::printf("\n");
  std::printf("[3] d^2 law: t_life ∝ R0^2 (dry N2, 25 C)\n");
  double TR, xR;
  surface_state(25.0, 0.0, TR, xR);
  const int ds[] = {10, 50, 100, 500};
  for (int d : ds) {
    const double R0 = d * 0.5e-6;
    std::printf("   d0 = %4d um   t_life = %10.3f s\n", d, CL * R0 * R0 / (2 * C * D * std::log(1 / (1 - xR))));
  }
  return 0;
}
