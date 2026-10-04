# Week 6 - Topic 1: Generalized Fourier Series & the Finite Fourier Transform (FFT)
# The FFT method (lecture Part 1): expand Theta in orthonormal basis functions
# Phi_n picked by the BCs, so a linear PDE becomes one ODE per mode:
#   Theta(x, y or t) = sum psi_n * Phi_n(x),  psi_n = <Phi_n, Theta>
# Dirichlet-Dirichlet basis: Phi_n = sqrt(2) sin(n*pi*x).
# Demos:
#   (1) Fourier-sine series of f(x) = 1 -> Gibbs overshoot near the boundaries
#   (2) transient membrane Theta(x,t) = (1-x) - 2 sum exp(-(n pi)^2 t) sin(n pi x)/(n pi)
#       -> steady state reached at t ~ 0.3 (in units of L^2/D), since exp(-pi^2*0.3) ~ 0.05
#   (3) 2D steady strip T = (4 T1/pi) sum exp(-n pi y)/n sin(n pi x) (odd n)

import math

def sine_series_of_one(x, N):
    """Partial sum of 1 = 2 sum_n [1-(-1)^n] sin(n pi x)/(n pi)."""
    s = 0.0
    for n in range(1, N + 1):
        s += 2.0 * (1 - (-1) ** n) / (n * math.pi) * math.sin(n * math.pi * x)
    return s

def membrane_theta(x, t, nmax=199):
    """Transient 1-D membrane: Theta(0,t)=1, Theta(1,t)=0, Theta(x,0)=0."""
    s = 1.0 - x
    for n in range(1, nmax + 1):
        s -= 2.0 * math.exp(-(n * math.pi) ** 2 * t) * math.sin(n * math.pi * x) / (n * math.pi)
    return s

def strip_T(x, y, kmax=200, T1=1.0):
    """2D semi-infinite strip, T = T1 at y = 0, T = 0 on the sides."""
    s = 0.0
    for k in range(kmax):
        n = 2 * k + 1
        s += math.exp(-n * math.pi * y) * math.sin(n * math.pi * x) / n
    return 4.0 * T1 / math.pi * s

if __name__ == "__main__":
    # --- (1) Gibbs phenomenon ---
    print("Fourier-sine series of f(x) = 1 (odd extension jumps by 2 at x = 0, 1):")
    print("  N      max of partial sum   (Gibbs: ~1.179 = 1 + 2 x 8.95%)")
    for N in (9, 49, 199, 999):
        xs = [i / 4000.0 for i in range(1, 4000)]
        m = max(sine_series_of_one(x, N) for x in xs)
        print(f"  {N:4d}   {m:8.4f}")
    print("  -> the overshoot never decays; it only squeezes toward the jump.")

    # --- (2) transient membrane: approach to steady state ---
    print("\nTransient membrane, Theta(x,t) vs steady profile 1-x:")
    print("  t       Theta(0.5,t)   first-mode factor exp(-pi^2 t)")
    for t in (0.01, 0.05, 0.1, 0.2, 0.3, 0.5):
        print(f"  {t:4.2f}   {membrane_theta(0.5, t):10.4f}     {math.exp(-math.pi**2 * t):10.4f}")
    print(f"  -> exp(-pi^2 * 0.3) = {math.exp(-math.pi**2*0.3):.4f} ~ 0.05:")
    print("     steady state is reached at t ~ 0.3 (real time 0.3 L^2/D), the lecture's rule.")

    # --- (3) 2D strip spot checks ---
    print("\n2D strip solution (T1 = 1):")
    for (x, y) in ((0.5, 0.25), (0.5, 0.5), (0.25, 0.1)):
        print(f"  T({x}, {y:4.2f}) = {strip_T(x, y):.6f}")
    print(f"  BC check: T(0.5, 0) = {strip_T(0.5, 0.0, kmax=20000):.4f} (-> 1, Gibbs-limited)")

    # --- FFT bookkeeping: orthonormality of the basis ---
    import math as _m
    N = 2000
    dx = 1.0 / N
    dot = sum(2.0 * _m.sin(2 * _m.pi * (i + 0.5) * dx) * _m.sin(3 * _m.pi * (i + 0.5) * dx) * dx
              for i in range(N))
    norm = sum(2.0 * _m.sin(2 * _m.pi * (i + 0.5) * dx) ** 2 * dx for i in range(N))
    print(f"\nOrthonormality: <Phi_2, Phi_3> = {dot:.2e},  <Phi_2, Phi_2> = {norm:.6f}")

    assert abs(membrane_theta(0.0, 0.2) - 1.0) < 1e-6
    assert abs(membrane_theta(1.0, 0.2)) < 1e-6
