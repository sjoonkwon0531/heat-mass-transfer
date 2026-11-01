// Week 10 - Topic 3: Diffusion with Reaction: Liquid Film (Hatta) and CVD Growth (Grove Model)
// Lecture (Part 1):
//   * gas A absorbed into liquid B with first-order homogeneous reaction R_A = -k1 c_A:
//       D_AB d^2c_A/dz^2 - k1 c_A = 0,  c_A(0) = c_A0,  c_A(delta) = 0
//       c_A(z) = c_A0 [cosh(phi z/delta) - sinh(phi z/delta)/tanh(phi)],  phi = delta sqrt(k1/D_AB)
//       N_Az|0 = (D_AB c_A0/delta) * phi/tanh(phi)
//     phi is the Hatta number Ha; E = Ha/tanh(Ha) is the enhancement over physical absorption
//     (the lecture labels this flux ratio "Hatta number").
//     large k1: N_Az -> sqrt(D_AB k1) c_A0, so k_c ~ D^(1/2) (vs k_c ~ D for the film model)
//   * CVD growth (Grove): gas-phase transfer F1 = h_g (C_g - C_s), surface reaction F2 = k_s C_s
//       steady state: F1 = F2 -> growth rate = (h_g k_s/(h_g + k_s)) C_g / rho
//       low T: k_s = k_s0 exp(-Ea/kT) << h_g -> reaction limited (Ea ~ 1.9 eV)
//       high T: k_s >> h_g ~ T^n (n = 1.5-2) -> mass-transport limited
// CVD parameter values are illustrative.

// Build: g++ -O2 -std=c++17 week10_topic3_reaction_film_cvd.cpp -o topic3
#include <cmath>
#include <cstdio>
#include <initializer_list>
#include <vector>

const double KB_EV = 8.617333262e-5;

double filmProfile(double zeta, double Ha) { return std::cosh(Ha * zeta) - std::sinh(Ha * zeta) / std::tanh(Ha); }
double enhancement(double Ha) { return Ha / std::tanh(Ha); }

// u'' = Ha^2 u on [0,1], u(0) = 1, u(1) = 0 (Thomas algorithm); returns -u'(0)
double filmFDM(double Ha, int n, std::vector<double>& u) {
    double h = 1.0 / n;
    std::vector<double> a(n + 1, 0.0), b(n + 1, 1.0), c(n + 1, 0.0), d(n + 1, 0.0);
    d[0] = 1.0;
    for (int i = 1; i < n; ++i) { a[i] = 1.0; b[i] = -(2 + Ha * Ha * h * h); c[i] = 1.0; }
    for (int i = 1; i <= n; ++i) { double m = a[i] / b[i - 1]; b[i] -= m * c[i - 1]; d[i] -= m * d[i - 1]; }
    u.assign(n + 1, 0.0);
    u[n] = d[n] / b[n];
    for (int i = n - 1; i >= 0; --i) u[i] = (d[i] - c[i] * u[i + 1]) / b[i];
    return -(-3 * u[0] + 4 * u[1] - u[2]) / (2 * h);
}

double groveRate(double T, double& ks, double& hg, double ks0 = 1.0e9, double Ea = 1.9, double hg0 = 0.05, double n = 1.75) {
    ks = ks0 * std::exp(-Ea / (KB_EV * T));
    hg = hg0 * std::pow(T / 1000.0, n);
    return hg * ks / (hg + ks);
}

int main() {
    std::vector<double> u;
    std::printf(" Ha      E = Ha/tanh(Ha)   E from FDM    large-Ha limit (=Ha)\n");
    for (double Ha : {0.1, 0.5, 1.0, 2.0, 5.0, 10.0})
        std::printf("%5.1f   %12.5f   %10.5f   %10.3f\n", Ha, enhancement(Ha), filmFDM(Ha, 400, u), Ha);
    filmFDM(3.0, 400, u);
    std::printf("profile check Ha = 3, z/delta = 0.5: %.5f FDM: %.5f\n", filmProfile(0.5, 3.0), u[200]);

    double k1 = 100.0, delta = 1e-4;
    std::printf("\n D (m^2/s)   film k_c = D/delta   reaction k_c = sqrt(D k1)\n");
    for (double D : {5e-10, 1e-9, 2e-9, 4e-9}) std::printf(" %.1e    %.3e         %.3e\n", D, D / delta, std::sqrt(D * k1));
    std::printf(" doubling D: film x2, reaction x %.3f\n", std::sqrt(2.0));

    std::printf("\nGrove model (illustrative constants): rate ~ h_g k_s/(h_g + k_s)\n");
    std::printf("  T (K)   k_s        h_g        rate       regime\n");
    for (int T : {700, 800, 900, 1000, 1100, 1200, 1300}) {
        double ks, hg, r = groveRate(T, ks, hg);
        const char* reg = ks < 0.1 * hg ? "reaction-limited" : (ks > 10 * hg ? "transport-limited" : "mixed");
        std::printf("  %5d  %9.3e  %9.3e  %9.3e  %s\n", T, ks, hg, r, reg);
    }
    double ks, hg, T1 = 700, T2 = 750;
    double r1 = groveRate(T1, ks, hg), r2 = groveRate(T2, ks, hg);
    std::printf("  apparent Ea from the low-T slope = %.3f eV (input 1.9 eV)\n", -KB_EV * std::log(r2 / r1) / (1 / T2 - 1 / T1));
}
