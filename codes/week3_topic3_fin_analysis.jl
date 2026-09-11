# Week 3 - Topic 3: Extended Surfaces (Fins), Uniform Cross-Section, Steady State
# d^2(Theta)/dx^2 - m^2*Theta = 0, Theta = T - Tinf, m^2 = h*P/(k*Ac)
# BC cases: (1) Dirichlet-Dirichlet, (2) adiabatic tip, (3) Robin tip
# Run: julia week3_topic3_fin_analysis.jl

using Printf

function theta_ratio(x, L, m, bccase; thetaL_ratio=0.2, h_over_mk=0.5)
    if bccase == 1
        c = thetaL_ratio
        return (c - exp(-m * L)) * (exp(m * x) - exp(-m * x)) /
               (exp(m * L) - exp(-m * L)) + exp(-m * x)
    elseif bccase == 2
        return cosh(m * (L - x)) / cosh(m * L)
    elseif bccase == 3
        B = h_over_mk
        return (cosh(m * (L - x)) + B * sinh(m * (L - x))) /
               (cosh(m * L) + B * sinh(m * L))
    end
    error("bccase must be 1, 2, or 3")
end

# Aluminum pin fin: D = 5 mm, L = 50 mm, k = 200 W/mK, h = 25 W/m^2K
D, L, k, h, theta0 = 0.005, 0.050, 200.0, 25.0, 80.0
P = pi * D
Ac = pi * D^2 / 4
m = sqrt(h * P / (k * Ac))
Qfin = sqrt(h * P * k * Ac) * theta0 * tanh(m * L)
eta = tanh(m * L) / (m * L)
eps = Qfin / (h * Ac * theta0)

@printf("Pin fin: m = %.4f 1/m, mL = %.4f\n", m, m * L)
@printf("Q_fin = %.3f W, eta = %.4f, eps = %.2f\n", Qfin, eta, eps)

mL, Lf = 2.0, 1.0
mm = mL / Lf
println("\nTheta/Theta0 profiles (mL = 2):")
println("  x/L     case1(D-D)  case2(adiab)  case3(Robin)")
for i in 0:5
    x = Lf * i / 5
    r1 = theta_ratio(x, Lf, mm, 1)
    r2 = theta_ratio(x, Lf, mm, 2)
    r3 = theta_ratio(x, Lf, mm, 3)
    @printf("  %4.2f    %9.5f   %9.5f     %9.5f\n", x / Lf, r1, r2, r3)
end

@assert abs(theta_ratio(0.0, Lf, mm, 2) - 1.0) < 1e-12
@assert abs(theta_ratio(Lf, Lf, mm, 2) - 1 / cosh(mL)) < 1e-12
@printf("\nCheck: 1/cosh(mL) = %.6f (matches adiabatic tip at x = L)\n", 1 / cosh(mL))
