// Week 4 - Topic 2: Transient Conduction in a Slab - Separation of Variables
// Y = (T - Ts)/(T0 - Ts) = (4/pi) sum_{n odd} (1/n) sin(n*pi*x/L) exp(-(n*pi/2)^2 Fo)
// Fo = alpha*t/(L/2)^2. First term alone is the Heisler-chart regime (Fo >= ~0.2).
// Compile: g++ -O2 -std=c++17 week4_topic2_separation_slab.cpp -o topic2 && ./topic2

#include <cmath>
#include <cstdio>
#include <cassert>
#include <initializer_list>

static const double PI = 3.14159265358979323846;

double slabSeries(double xOverL, double Fo, int nmax = 399) {
    double s = 0.0;
    for (int n = 1; n <= nmax; n += 2)
        s += std::sin(n * PI * xOverL) / n
             * std::exp(-std::pow(n * PI / 2.0, 2) * Fo);
    return 4.0 / PI * s;
}

double slabOneTerm(double xOverL, double Fo) {
    return 4.0 / PI * std::sin(PI * xOverL) * std::exp(-std::pow(PI / 2.0, 2) * Fo);
}

int main() {
    std::printf("Centerline history Y_c, x/L = 0.5\n");
    std::printf("  Fo     full series   1-term    rel. error\n");
    for (double Fo : {0.02, 0.05, 0.1, 0.2, 0.5, 1.0}) {
        double full = slabSeries(0.5, Fo);
        double one = slabOneTerm(0.5, Fo);
        std::printf("  %4.2f   %10.6f  %8.6f   %6.3f %%\n",
                    Fo, full, one, std::fabs(one - full) / full * 100.0);
    }
    std::printf("  -> beyond Fo ~ 0.2 one term is enough.\n");

    std::printf("\nProfiles Y(x) at Fo = 0.05 / 0.2 / 0.5:\n");
    for (double Fo : {0.05, 0.2, 0.5}) {
        std::printf("  Fo=%4.2f:", Fo);
        for (int i = 0; i <= 10; ++i)
            std::printf(" %5.3f ", slabSeries(i / 10.0, Fo));
        std::printf("\n");
    }

    // Worked example: 20 mm steel plate, T0 = 600, surfaces -> 30 degC
    double L = 0.020, alpha = 45.0 / (7800.0 * 480.0), T0 = 600.0, Ts = 30.0;
    double half = L / 2.0;
    std::printf("\nWorked example: 20 mm steel plate, T0 = 600 -> Ts = 30 degC\n");
    for (double t : {0.5, 1.0, 2.0, 5.0, 10.0}) {
        double Fo = alpha * t / (half * half);
        double Tc = Ts + (T0 - Ts) * slabSeries(0.5, Fo);
        std::printf("  t = %5.1f s  Fo = %6.3f  T_center = %7.2f degC\n", t, Fo, Tc);
    }

    // sanity checks
    assert(std::fabs(slabSeries(0.0, 0.3)) < 1e-12);
    assert(std::fabs(slabSeries(1.0, 0.3)) < 1e-12);
    double y0 = slabSeries(0.5, 1e-6, 19999);
    assert(std::fabs(y0 - 1.0) < 1e-3);
    std::printf("\nBC check: Y(0)=Y(L)=0 exactly; Y(center, Fo->0) = %.6f\n", y0);
    return 0;
}
