// Week 10 - Topic 1: Stefan Tube (Arnold Cell), Log-Mean, Film Model, Pseudo-Steady D Measurement
// Lecture (Part 1):
//   * steady 1D diffusion of A through stagnant B (N_Bz = 0):
//       N_Az = -cD_AB/(1 - y_A) dy_A/dz = const
//       N_Az = cD_AB/(z2 - z1) ln[(1 - y_A2)/(1 - y_A1)] = cD_AB (y_A1 - y_A2)/((z2 - z1) y_B,lm)
//       y_B,lm = (y_B2 - y_B1)/ln(y_B2/y_B1)
//   * profile: (1 - y_A)/(1 - y_A1) = [(1 - y_A2)/(1 - y_A1)]^((z - z1)/(z2 - z1))
//   * film model: k_c = P D_AB/(delta p_B,lm)
//   * pseudo-steady Arnold cell (liquid level falls slowly):
//       rho_AL/M_A dz/dt = cD_AB (y_A1 - y_A2)/(z y_B,lm)
//       -> t = rho_AL y_B,lm (z^2 - z0^2)/(2 c D_AB M_A (y_A1 - y_A2))
//       -> D_AB from the slope of (z^2 - z0^2) versus t.

// Build: g++ -O2 -std=c++17 week10_topic1_stefan_tube.cpp -o topic1
#include <cmath>
#include <cstdio>
#include <initializer_list>
#include <map>
#include <random>
#include <string>
#include <vector>

const double R = 8.314462618;
struct Liq { double A, B, C, rho, M, vol; };
std::map<std::string, Liq> L = {
    {"water", {8.07131, 1730.63, 233.426, 997.0, 18.015, 12.7}},
    {"ethanol", {8.20417, 1642.89, 230.300, 789.0, 46.07, 2 * 16.5 + 6 * 1.98 + 5.48}},
    {"acetone", {7.02447, 1161.0, 224.0, 784.0, 58.08, 3 * 16.5 + 6 * 1.98 + 5.48}}};
const double VAIR = 20.1;

double psat(const std::string& n, double TC) { const Liq& q = L[n]; return std::pow(10.0, q.A - q.B / (q.C + TC)) * 133.322; }
double fuller(const std::string& n, double TK, double Patm = 1.0) {
    double Ma = L[n].M, Mb = 28.97, den = std::pow(std::cbrt(L[n].vol) + std::cbrt(VAIR), 2);
    return 1.011e-3 * std::pow(TK, 1.75) * std::sqrt(1 / Ma + 1 / Mb) / (Patm * den) * 1e-4;
}
double ylm(double yA1, double yA2) { double b1 = 1 - yA1, b2 = 1 - yA2; return std::fabs(b2 - b1) > 1e-12 ? (b2 - b1) / std::log(b2 / b1) : b1; }
double stefanFlux(double c, double D, double Lz, double y1, double y2) { return c * D / Lz * std::log((1 - y2) / (1 - y1)); }
double profile(double z, double Lz, double y1, double y2) { return 1 - (1 - y1) * std::pow((1 - y2) / (1 - y1), z / Lz); }

int main() {
    double P = 101325.0, TC = 25.0, T = TC + 273.15, c = P / (R * T), Lz = 0.10;
    std::printf("Stefan tube, L = %.0f cm, %.1f C, 1 atm, c = %.3f mol/m^3\n", Lz * 100, TC, c);
    std::printf(" liquid    p_sat(kPa)  y_A1    D(cm^2/s)  y_B,lm   N_A (mol/m^2 s)  Stefan/Fick\n");
    for (std::string n : {"water", "ethanol", "acetone"}) {
        double y1 = psat(n, TC) / P, D = fuller(n, T), N = stefanFlux(c, D, Lz, y1, 0.0), Nf = c * D * y1 / Lz;
        std::printf(" %-8s %9.2f  %6.4f  %8.4f  %7.4f  %14.4e  %9.4f\n", n.c_str(), psat(n, TC) / 1e3, y1, D * 1e4, ylm(y1, 0), N, N / Nf);
    }
    double y1 = psat("acetone", TC) / P, D = fuller("acetone", T);
    double N1 = stefanFlux(c, D, Lz, y1, 0.0), N2 = c * D * y1 / (Lz * ylm(y1, 0.0));
    std::printf("\nlog form %.6e vs log-mean form %.6e\n", N1, N2);
    double mean = 0; int n = 1000;
    for (int i = 0; i < n; ++i) mean += 0.5 * ((1 - profile(i * Lz / n, Lz, y1, 0)) + (1 - profile((i + 1) * Lz / n, Lz, y1, 0))) / n;
    std::printf("path-averaged y_B = %.6f equals y_B,lm = %.6f\n", mean, ylm(y1, 0.0));
    double delta = 2e-3, kc = P * D / (delta * ylm(y1, 0.0) * P);
    std::printf("film model (delta = 2 mm): k_c = P D/(delta p_B,lm) = %.3f cm/s\n", kc * 100);

    // pseudo-steady Arnold cell: synthetic experiment and back-calculation of D
    double rhoL = L["water"].rho, MA = L["water"].M;
    y1 = psat("water", TC) / P;
    double Dt = fuller("water", T), z0 = 0.02;
    double K = 2 * c * Dt * MA * 1e-3 * y1 / (rhoL * ylm(y1, 0.0));
    std::mt19937 gen(3); std::normal_distribution<double> noise(0.0, 2e-5);
    double sxy = 0, sxx = 0, zlast = 0;
    for (int d : {1, 2, 4, 6, 8, 10, 14}) {
        double t = d * 86400.0, z = std::sqrt(z0 * z0 + K * t) + noise(gen);
        sxy += t * (z * z - z0 * z0); sxx += t * t; zlast = z;
    }
    double Dfit = sxy / sxx * rhoL * ylm(y1, 0.0) / (2 * c * MA * 1e-3 * y1);
    std::printf("\nArnold cell (water, z0 = 2 cm): level after 14 days z = %.3f cm\n", zlast * 100);
    std::printf("D_true = %.4f cm^2/s, D from (z^2 - z0^2) vs t fit = %.4f cm^2/s\n", Dt * 1e4, Dfit * 1e4);
}
