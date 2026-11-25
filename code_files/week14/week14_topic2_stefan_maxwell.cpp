// Week 14 · Topic 2 — Stefan–Maxwell equations: A diffusing through a stagnant B + C mixture
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   dx_B/dz = x_B N_A/(C D_AB),  dx_C/dz = x_C N_A/(C D_AC)  (N_B = N_C = 0)
//   x_B(z) = x_B(L) exp[-N_A(L-z)/(C D_AB)], same for C;  N_A from x_A(0) = 1 - x_B(0) - x_C(0)
// Build: g++ -O2 -std=c++17 week14_topic2_stefan_maxwell.cpp -o t2 && ./t2
#include <cmath>
#include <cstdio>

double solve_NA(double xA0, double xBL, double xCL, double L, double C, double DAB, double DAC) {
  auto resid = [&](double N) {
    const double xB0 = xBL * std::exp(-N * L / (C * DAB)), xC0 = xCL * std::exp(-N * L / (C * DAC));
    return (1 - xB0 - xC0) - xA0;
  };
  double lo = 0.0, hi = 1.0;
  while (resid(hi) < 0) hi *= 2;
  for (int i = 0; i < 200; ++i) {
    const double mid = 0.5 * (lo + hi);
    if (resid(mid) < 0) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}

int main() {
  std::printf("Topic 2 — Stefan–Maxwell: A through stagnant B + C\n\n");
  const double C = 40.9, L = 0.10, DAB = 2.6e-5, DAC = 9.0e-5, xA0 = 0.20, xAL = 0.0;
  std::printf("   C = %g mol/m3, L = %g m, D_AB = %.1e, D_AC = %.1e m2/s, x_A(0) = %g, x_A(L) = 0\n\n", C, L, DAB, DAC, xA0);
  std::printf("[1] Binary check (no C): Stefan–Maxwell versus the log formula\n");
  std::printf("   N_A (Stefan–Maxwell) = %.6e mol/(m2 s)\n", solve_NA(xA0, 1.0, 0.0, L, C, DAB, DAC));
  std::printf("   N_A (log formula)    = %.6e mol/(m2 s)\n\n", C * DAB / L * std::log((1 - xAL) / (1 - xA0)));
  std::printf("[2] Ternary: top gas is a B + C mixture\n");
  std::printf("    x_C(L)     N_A (mol/m2 s)    D_A,mix at the top (m2/s)\n");
  const double xcs[] = {0.0, 0.25, 0.5, 0.75, 1.0};
  for (double xCL : xcs) {
    const double xBL = 1 - xCL, N = solve_NA(xA0, xBL, xCL, L, C, DAB, DAC);
    const double Dmix = 1.0 / (xBL / DAB + xCL / DAC);
    std::printf("    %5.2f      %.4e        %.3e\n", xCL, N, Dmix);
  }
  std::printf("   (Adding the fast partner C raises the flux of A.)\n\n");
  std::printf("[3] Composition profiles for x_C(L) = 0.5\n");
  const double N = solve_NA(xA0, 0.5, 0.5, L, C, DAB, DAC);
  std::printf("     z/L      x_A       x_B       x_C\n");
  for (int k = 0; k < 6; ++k) {
    const double z = L * k / 5;
    const double xB = 0.5 * std::exp(-N * (L - z) / (C * DAB)), xC = 0.5 * std::exp(-N * (L - z) / (C * DAC));
    std::printf("    %4.1f    %.4f    %.4f    %.4f\n", z / L, 1 - xB - xC, xB, xC);
  }
  std::printf("   B (slow partner) is depleted near the liquid more than C: x_B/x_C is not constant.\n");
  return 0;
}
