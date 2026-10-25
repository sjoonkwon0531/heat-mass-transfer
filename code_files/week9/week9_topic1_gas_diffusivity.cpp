// Week 9 - Topic 1: Gas Diffusivity (Kinetic Theory, Chapman-Enskog, Fuller)
// Chapman-Enskog (D in cm^2/s, T in K, P in atm, sigma in Angstrom):
//   D_AB = 1.858e-3 T^(3/2) sqrt(1/M_A + 1/M_B) / (P sigma_AB^2 Omega_D)
//   sigma_AB = (sigma_A + sigma_B)/2,  eps_AB = sqrt(eps_A eps_B),  Omega_D = f(kB T/eps_AB)
// Fuller: D_AB = 1.011e-3 T^1.75 sqrt(1/M_A + 1/M_B) / (P [(sum v_A)^(1/3) + (sum v_B)^(1/3)]^2)
// Kinetic theory: lambda = kB T/(sqrt(2) pi sigma^2 P), u = sqrt(8RT/(pi M)), D_AA* = lambda u/3
// Build: g++ -O2 -std=c++17 week9_topic1_gas_diffusivity.cpp -o topic1
#include <cmath>
#include <cstdio>
#include <initializer_list>
#include <map>
#include <string>

struct Gas { double sigma, eps, M, vol; };  // Angstrom, K, g/mol, Fuller volume

const double KB = 1.380649e-23, R = 8.314462618, ATM = 101325.0;
std::map<std::string, Gas> G = {
    {"H2", {2.968, 33.3, 2.016, 7.07}},   {"He", {2.576, 10.2, 4.003, 2.88}},
    {"N2", {3.681, 91.5, 28.01, 17.9}},   {"O2", {3.433, 113.0, 32.00, 16.6}},
    {"Air", {3.617, 97.0, 28.97, 20.1}},  {"Ar", {3.418, 124.0, 39.95, 16.1}},
    {"CO2", {3.996, 190.0, 44.01, 26.9}}, {"CH4", {3.822, 137.0, 16.04, 16.5 + 4 * 1.98}}};

double omegaD(double ts) {  // Neufeld-Janzen-Aziz (1972)
    return 1.06036 / std::pow(ts, 0.15610) + 0.19300 / std::exp(0.47635 * ts) +
           1.03587 / std::exp(1.52996 * ts) + 1.76474 / std::exp(3.89411 * ts);
}

double chapmanEnskog(const std::string& a, const std::string& b, double T, double P = 1.0,
                     double* om = nullptr) {
    const Gas &A = G[a], &B = G[b];
    double sab = 0.5 * (A.sigma + B.sigma), eab = std::sqrt(A.eps * B.eps);
    double o = omegaD(T / eab);
    if (om) *om = o;
    return 1.858e-3 * std::pow(T, 1.5) * std::sqrt(1 / A.M + 1 / B.M) / (P * sab * sab * o);
}

double fuller(const std::string& a, const std::string& b, double T, double P = 1.0) {
    const Gas &A = G[a], &B = G[b];
    double den = std::pow(std::cbrt(A.vol) + std::cbrt(B.vol), 2);
    return 1.011e-3 * std::pow(T, 1.75) * std::sqrt(1 / A.M + 1 / B.M) / (P * den);
}

int main() {
    std::printf("Omega_D(1) = %.4f (table 1.439), Omega_D(10) = %.4f (table 0.7424)\n", omegaD(1), omegaD(10));
    double T = 293.15, om;
    double D = chapmanEnskog("CO2", "Air", T, 1.0, &om);
    std::printf("\nCO2-air, %.2f K, 1 atm: Omega_D = %.4f, D_CE = %.4f cm^2/s, D_Fuller = %.4f cm^2/s\n",
                T, om, D, fuller("CO2", "Air", T));
    std::printf("\nPair        T(K)   Chapman-Enskog   Fuller   (cm^2/s)\n");
    const char* pairs[][2] = {{"H2", "N2"}, {"O2", "N2"}, {"CO2", "N2"}, {"He", "Ar"}, {"CH4", "Air"}};
    for (auto& p : pairs)
        for (double TT : {300.0, 600.0})
            std::printf("%4s-%-5s %6.0f   %10.4f   %8.4f\n", p[0], p[1], TT, chapmanEnskog(p[0], p[1], TT),
                        fuller(p[0], p[1], TT));
    // kinetic-theory self-diffusion of N2
    double s = G["N2"].sigma * 1e-10, Tn = 300.0;
    double lam = KB * Tn / (std::sqrt(2.0) * M_PI * s * s * ATM);
    double u = std::sqrt(8 * R * Tn / (M_PI * G["N2"].M * 1e-3));
    std::printf("\nN2 300 K: lambda = %.1f nm, u = %.0f m/s, D_kin = %.3f cm^2/s\n", lam * 1e9, u,
                lam * u / 3 * 1e4);
    return 0;
}
