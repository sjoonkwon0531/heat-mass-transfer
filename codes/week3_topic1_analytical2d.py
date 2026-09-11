# Week 3 - Topic 1: 2D Steady-State Heat Conduction (Analytical, Separation of Variables)
# T(x,y) = (4*T1/pi) * sum_{k=0}^{kmax} 1/(2k+1) * exp(-(2k+1)*pi*y/L) * sin((2k+1)*pi*x/L)
# Domain: semi-infinite strip, T=T1 at y=0, T=0 at x=0, x=L, y->inf
# Also computes the heat flux components qx, qy from q = -k*grad(T).

import numpy as np

def temperature(x, y, kmax=30, T1=1.0, L=1.0):
    """Normalized temperature field via truncated Fourier series."""
    T = np.zeros_like(x, dtype=float)
    for k in range(kmax + 1):
        n = 2 * k + 1
        T += (1.0 / n) * np.exp(-n * np.pi * y / L) * np.sin(n * np.pi * x / L)
    return (4.0 * T1 / np.pi) * T

def heat_flux(x, y, kmax=30, T1=1.0, L=1.0, kcond=1.0):
    """Heat flux components (qx, qy) = -k * grad(T), evaluated term by term."""
    qx = np.zeros_like(x, dtype=float)
    qy = np.zeros_like(x, dtype=float)
    for k in range(kmax + 1):
        n = 2 * k + 1
        e = np.exp(-n * np.pi * y / L)
        qx += (np.pi / L) * e * np.cos(n * np.pi * x / L)
        qy += -(np.pi / L) * e * np.sin(n * np.pi * x / L)
    pref = 4.0 * T1 / np.pi
    return -kcond * pref * qx, -kcond * pref * qy

if __name__ == "__main__":
    L = 1.0
    xv = np.linspace(0.0, L, 101)
    yv = np.linspace(0.0, L, 101)
    X, Y = np.meshgrid(xv, yv)

    # Convergence of the series at the domain center (x=0.5L, y=0.5L)
    print("Convergence at (x, y) = (0.5L, 0.5L):")
    for kmax in (0, 5, 10, 20, 30):
        Tc = temperature(np.array(0.5), np.array(0.5), kmax=kmax)
        print(f"  kmax = {kmax:3d}  ->  T/T1 = {float(Tc):.8f}")

    # Full field and flux with kmax = 30
    T = temperature(X, Y, kmax=30)
    qx, qy = heat_flux(X, Y, kmax=30)
    print(f"\nField summary (kmax=30): T/T1 in [{T.min():.4f}, {T.max():.4f}]")
    print(f"T/T1 at (0.25, 0.10) = {temperature(np.array(0.25), np.array(0.10)):.6f}")
    print(f"T/T1 at (0.50, 0.25) = {temperature(np.array(0.50), np.array(0.25)):.6f}")
    print(f"|q|/k max on y=0.5 row = {np.hypot(qx[50], qy[50]).max():.6f}")

    # Boundary check: T(x -> 0 or L) ~ 0, T(y=0, x=0.5) -> ~1 (Gibbs near edges)
    print(f"\nBC check: T(0, 0.5)={temperature(np.array(0.0), np.array(0.5)):.2e}, "
          f"T(L, 0.5)={temperature(np.array(1.0), np.array(0.5)):.2e}, "
          f"T(0.5, 0)={temperature(np.array(0.5), np.array(0.0)):.6f}")
