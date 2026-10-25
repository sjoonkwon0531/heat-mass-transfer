// Week 9 - Topic 2: Liquid, Pore (Knudsen) and Solid Diffusivity
//   Stokes-Einstein: D = kB T/(6 pi r mu)
//   Wilke-Chang:     D_AB = 7.4e-8 sqrt(Phi_B M_B) T/(mu_B V_A^0.6)   [cm^2/s, cP, cm^3/mol]
//   Knudsen:         D_KA = (d/3) sqrt(8RT/(pi M)) = 4850 d sqrt(T/M)  [d in cm -> cm^2/s]
//   Transition:      1/D_Ae = (1 - alpha y_A)/D_AB + 1/D_KA;   porous solid: D'_Ae = eps^2 D_Ae
//   Solids:          D = D0 exp(-Q/RT)  (lecture table)
// Build: g++ -O2 -std=c++17 week9_topic2_condensed_pore_diffusivity.cpp -o topic2
#include <cmath>
#include <cstdio>
#include <initializer_list>

const double KB = 1.380649e-23, R = 8.314462618;

double wilkeChang(double T, double mu, double MB, double VA, double phi) {
    return 7.4e-8 * std::sqrt(phi * MB) * T / (mu * std::pow(VA, 0.6));
}
double knudsen(double dcm, double T, double M) { return 4850.0 * dcm * std::sqrt(T / M); }
double effective(double DAB, double DK, double alpha = 0, double yA = 0) {
    return 1.0 / ((1 - alpha * yA) / DAB + 1.0 / DK);
}
double arrhenius(double D0mm2, double QkJ, double T) { return D0mm2 * 1e-6 * std::exp(-QkJ * 1e3 / (R * T)); }

int main() {
    double T = 298.15, mu = 0.890;
    std::printf("Wilke-Chang, O2 in water at 25 C: D = %.3e cm^2/s\n", wilkeChang(T, mu, 18.02, 25.6, 2.26));
    double r = 5e-9;
    double Dse = KB * T / (6 * M_PI * r * mu * 1e-3);
    std::printf("Stokes-Einstein, 10 nm particle: D = %.3e m^2/s\n", Dse);

    double Tk = 300.0, M = 28.0, DAB = 0.20;
    std::printf("\nN2 300 K, D_AB = 0.20 cm^2/s\n  d (nm)    D_K (cm^2/s)   D_Ae (cm^2/s)\n");
    for (double dnm : {1.0, 10.0, 50.0, 100.0, 1000.0, 10000.0}) {
        double DK = knudsen(dnm * 1e-7, Tk, M);
        std::printf("  %7.0f   %12.4e   %12.4e\n", dnm, DK, effective(DAB, DK));
    }
    struct S { const char* name; double D0, Q; } tab[] = {
        {"Au self (fcc)", 10.7, 176.9}, {"Cu self (fcc)", 31.0, 200.3}, {"Ni self (fcc)", 190.0, 279.7},
        {"Fe(gamma) self", 49.0, 284.1}, {"Fe(alpha) self", 200.0, 239.7}, {"C in Fe (bcc)", 2.0, 84.1},
        {"N in Fe (bcc)", 0.3, 76.1}, {"H in Fe (bcc)", 0.1, 13.4}, {"C in Fe (fcc)", 2.5, 144.2}};
    std::printf("\nSolid-state diffusivity at 1000 K\n");
    for (auto& s : tab) {
        double D = arrhenius(s.D0, s.Q, 1000.0);
        std::printf("  %-16s D = %.3e m^2/s, sqrt(D*1h) = %9.3f um\n", s.name, D, std::sqrt(D * 3600) * 1e6);
    }
    return 0;
}
