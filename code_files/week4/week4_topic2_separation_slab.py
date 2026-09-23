# Week 4 - Topic 2: Transient Conduction in a Slab - Separation of Variables
# Plate of thickness L, both faces suddenly set to Ts, uniform initial T0 (lecture).
#   Y = (T - Ts)/(T0 - Ts),  Y = A(x)B(t)  ->  Y = sum C_n sin(n*pi*x/L) exp(-(n*pi/2)^2 Fo)
# Uniform IC keeps only odd n with C_n = 4/(n*pi):
#   Y(x,t) = (4/pi) sum_{n odd} (1/n) sin(n*pi*x/L) exp(-(n*pi/2)^2 * Fo),
#   Fo = alpha*t/(L/2)^2   (lecture's Fourier modulus, built on the half-thickness)
# Key teaching point: for Fo >= ~0.2 the first term alone is enough (Heisler-chart regime).

import math

def slab_series(x_over_L, Fo, nmax=399):
    """Full truncated series for Y(x,t)."""
    s = 0.0
    for n in range(1, nmax + 1, 2):
        s += (1.0 / n) * math.sin(n * math.pi * x_over_L) \
             * math.exp(-((n * math.pi / 2.0) ** 2) * Fo)
    return 4.0 / math.pi * s

def slab_one_term(x_over_L, Fo):
    """First-term (n=1) approximation - the analytical core of the Heisler chart."""
    return 4.0 / math.pi * math.sin(math.pi * x_over_L) \
           * math.exp(-((math.pi / 2.0) ** 2) * Fo)

if __name__ == "__main__":
    print("Centerline history Y_c = (Tc - Ts)/(T0 - Ts), x/L = 0.5")
    print("  Fo     full series   1-term    rel. error")
    for Fo in (0.02, 0.05, 0.1, 0.2, 0.5, 1.0):
        full = slab_series(0.5, Fo)
        one = slab_one_term(0.5, Fo)
        print(f"  {Fo:4.2f}   {full:10.6f}  {one:8.6f}   {abs(one-full)/full*100:6.3f} %")
    print("  -> beyond Fo ~ 0.2 one term is enough: exp(-2*pi^2*Fo/4) kills n=3 fast.")

    # Spatial profiles at a few Fo (what the Heisler chart compresses to one curve)
    print("\nProfiles Y(x) at Fo = 0.05 / 0.2 / 0.5:")
    xs = [i / 10.0 for i in range(11)]
    for Fo in (0.05, 0.2, 0.5):
        prof = "  ".join(f"{slab_series(x, Fo):5.3f}" for x in xs)
        print(f"  Fo={Fo:4.2f}: {prof}")

    # Worked example: 20 mm steel plate quenched from 600 to 30 degC surfaces
    L = 0.020                      # thickness [m]
    alpha = 45.0 / (7800.0 * 480.0)  # steel [m^2/s]
    T0, Ts = 600.0, 30.0
    half = L / 2.0
    print("\nWorked example: 20 mm steel plate, T0 = 600, surfaces -> 30 degC")
    for t in (0.5, 1.0, 2.0, 5.0, 10.0):
        Fo = alpha * t / half**2
        Tc = Ts + (T0 - Ts) * slab_series(0.5, Fo)
        print(f"  t = {t:5.1f} s  Fo = {Fo:6.3f}  T_center = {Tc:7.2f} degC")

    # sanity checks: IC and BC
    assert abs(slab_series(0.0, 0.3)) < 1e-12 and abs(slab_series(1.0, 0.3)) < 1e-12
    y0 = slab_series(0.5, 1e-6, nmax=19999)
    assert abs(y0 - 1.0) < 1e-3      # series -> 1 as Fo -> 0 (Gibbs-limited)
    print("\nBC check: Y(0)=Y(L)=0 exactly; Y(center, Fo->0) =", f"{y0:.6f}")
