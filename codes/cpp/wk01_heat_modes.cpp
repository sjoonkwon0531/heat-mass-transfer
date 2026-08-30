// Wk01 - Conduction vs convection vs radiation (CSV output)
// Build: g++ -O2 -std=c++17 wk01_heat_modes.cpp -o modes && ./modes
// Output: heat_modes.csv (Ts, q_cond, q_conv, q_rad in W/m^2)
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <cmath>

int main() {
    const double SIGMA = 5.670e-8, T_INF = 25.0;
    const double K = 0.6, L = 0.02, H = 25.0, EPS = 0.85;

    FILE* f = std::fopen("heat_modes.csv", "w");
    std::fprintf(f, "Ts_C,q_cond,q_conv,q_rad\n");
    double cross = -1.0, prev = -1.0;
    for (int i = 0; i <= 400; ++i) {
        double Ts = 30.0 + (900.0 - 30.0) * i / 400.0;
        double dT = Ts - T_INF;
        double qc = K * dT / L;
        double qv = H * dT;
        double qr = EPS * SIGMA *
            (std::pow(Ts + 273.15, 4) - std::pow(T_INF + 273.15, 4));
        std::fprintf(f, "%.1f,%.1f,%.1f,%.1f\n", Ts, qc, qv, qr);
        double d = qr - qv;
        if (prev < 0 && d >= 0 && cross < 0) cross = Ts;
        prev = d;
    }
    std::fclose(f);
    std::printf("Radiation passes convection near Ts = %.0f C\n", cross);
    std::puts("Wrote heat_modes.csv");
    return 0;
}
