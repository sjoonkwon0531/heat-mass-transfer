# Week 3 - Topic 3: Extended Surfaces (Fins), Uniform Cross-Section, Steady State
# Governing eqn: d^2(Theta)/dx^2 - m^2 * Theta = 0,  Theta = T - Tinf,  m^2 = h*P/(k*Ac)
# Three BC cases (matching the lecture):
#   1) Dirichlet-Dirichlet:  T(0)=T0, T(L)=TL
#   2) Dirichlet-Neumann  :  T(0)=T0, dT/dx|_L = 0 (adiabatic tip)
#   3) Dirichlet-Robin    :  T(0)=T0, -k dT/dx|_L = h (T(L)-Tinf) (convective tip)
# Efficiency (adiabatic tip): eta = tanh(mL)/(mL);  Q_fin = sqrt(hPkAc)*Theta0*tanh(mL)

import math

def theta_ratio(x, L, m, case, thetaL_over_theta0=0.2, h_over_mk=0.5):
    """Theta(x)/Theta0 for the three BC cases."""
    if case == 1:  # both ends Dirichlet
        c = thetaL_over_theta0
        num = (c - math.exp(-m * L)) * (math.exp(m * x) - math.exp(-m * x))
        den = math.exp(m * L) - math.exp(-m * L)
        return num / den + math.exp(-m * x)
    if case == 2:  # adiabatic tip
        return math.cosh(m * (L - x)) / math.cosh(m * L)
    if case == 3:  # convective (Robin) tip
        B = h_over_mk
        return (math.cosh(m * (L - x)) + B * math.sinh(m * (L - x))) / \
               (math.cosh(m * L) + B * math.sinh(m * L))
    raise ValueError("case must be 1, 2, or 3")

def fin_performance(h, P, k, Ac, L, theta0):
    """Adiabatic-tip fin: heat rate, efficiency, effectiveness."""
    m = math.sqrt(h * P / (k * Ac))
    Q_fin = math.sqrt(h * P * k * Ac) * theta0 * math.tanh(m * L)
    eta = math.tanh(m * L) / (m * L)
    A_fin = P * L
    eps = Q_fin / (h * Ac * theta0)   # vs. bare base area Ac
    return m, Q_fin, eta, eps, A_fin

if __name__ == "__main__":
    # Aluminum pin fin: D=5 mm, L=50 mm, k=200 W/mK, h=25 W/m^2K, Tb-Tinf=80 K
    D, L, k, h, theta0 = 0.005, 0.050, 200.0, 25.0, 80.0
    P = math.pi * D
    Ac = math.pi * D * D / 4.0
    m, Q, eta, eps, A_fin = fin_performance(h, P, k, Ac, L, theta0)
    print("Aluminum pin fin (D=5 mm, L=50 mm):")
    print(f"  m = {m:.4f} 1/m,  mL = {m*L:.4f}")
    print(f"  Q_fin = {Q:.3f} W,  efficiency eta = {eta:.4f},  effectiveness eps = {eps:.2f}")

    # Temperature profiles for the three BC cases (mL = 2 for comparison)
    mL = 2.0
    Lf = 1.0
    mm = mL / Lf
    print("\nTheta/Theta0 profiles (mL = 2):")
    print("  x/L     case1(D-D)  case2(adiab)  case3(Robin)")
    for i in range(6):
        x = Lf * i / 5.0
        r1 = theta_ratio(x, Lf, mm, 1)
        r2 = theta_ratio(x, Lf, mm, 2)
        r3 = theta_ratio(x, Lf, mm, 3)
        print(f"  {x/Lf:4.2f}    {r1:9.5f}   {r2:9.5f}     {r3:9.5f}")

    # Sanity checks
    assert abs(theta_ratio(0.0, Lf, mm, 2) - 1.0) < 1e-12
    tip2 = theta_ratio(Lf, Lf, mm, 2)
    assert abs(tip2 - 1.0 / math.cosh(mL)) < 1e-12
    print(f"\nCheck: adiabatic-tip value 1/cosh(mL) = {1.0/math.cosh(mL):.6f} (matches x=L)")
