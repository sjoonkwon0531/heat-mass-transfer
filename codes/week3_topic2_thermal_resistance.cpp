// Week 3 - Topic 2: Combined Conduction + Convection via Thermal Resistance Networks
// Q = dT / sum(R_i); R_conv = 1/(h*A); R_slab = L/(k*A); R_cyl = ln(ro/ri)/(2*pi*L*k)
// Compile: g++ -O2 -std=c++17 week3_topic2_thermal_resistance.cpp -o topic2 && ./topic2

#include <cmath>
#include <cstdio>
#include <vector>
#include <string>

static const double PI = 3.14159265358979323846;

int main() {
    // --- Case A: 3-layer plane wall with two-sided convection ---
    double Th = 300.0, Tc = 20.0, A = 1.0;
    double hL = 25.0, hR = 10.0;
    std::vector<std::pair<double, double>> layers = {
        {0.02, 15.0}, {0.10, 0.5}, {0.01, 45.0}};  // (thickness m, k W/mK)

    std::vector<double> R;
    std::vector<std::string> names;
    R.push_back(1.0 / (hL * A)); names.push_back("conv,L");
    for (size_t i = 0; i < layers.size(); ++i) {
        R.push_back(layers[i].first / (layers[i].second * A));
        names.push_back("cond," + std::to_string(i + 1));
    }
    R.push_back(1.0 / (hR * A)); names.push_back("conv,R");

    double Rtot = 0.0;
    for (double r : R) Rtot += r;
    double Q = (Th - Tc) / Rtot;
    double U = 1.0 / (A * Rtot);

    std::printf("Case A: 3-layer plane wall with two-sided convection\n");
    for (size_t i = 0; i < R.size(); ++i)
        std::printf("  R_%-7s = %10.6f K/W\n", names[i].c_str(), R[i]);
    std::printf("  R_total   = %10.6f K/W\n  Q = %.3f W,  U = %.4f W/m^2K\n", Rtot, Q, U);

    std::printf("  T profile: %.2f", Th);
    double T = Th;
    for (double r : R) { T -= Q * r; std::printf(", %.2f", T); }
    std::printf("\n");

    // --- Case B: insulated steam pipe, per meter ---
    double Lp = 1.0, h_in = 1500.0, h_out = 12.0;
    double r[3] = {0.025, 0.030, 0.055};
    double kshell[2] = {50.0, 0.06};
    double A_in = 2.0 * PI * r[0] * Lp, A_out = 2.0 * PI * r[2] * Lp;
    double R2[4];
    R2[0] = 1.0 / (h_in * A_in);
    R2[1] = std::log(r[1] / r[0]) / (2.0 * PI * Lp * kshell[0]);
    R2[2] = std::log(r[2] / r[1]) / (2.0 * PI * Lp * kshell[1]);
    R2[3] = 1.0 / (h_out * A_out);
    double Rt2 = R2[0] + R2[1] + R2[2] + R2[3];
    double Q2 = (250.0 - 25.0) / Rt2;

    const char* lab[4] = {"conv,in", "cond,steel", "cond,insul", "conv,out"};
    std::printf("\nCase B: insulated steam pipe, per meter of pipe\n");
    for (int i = 0; i < 4; ++i)
        std::printf("  R_%-10s = %10.6f K/W\n", lab[i], R2[i]);
    std::printf("  Q per meter = %.2f W/m\n", Q2);
    return 0;
}
