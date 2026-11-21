# Week 13 · Topic 4 — Two-resistance theory and packed-tower design
# Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
#   1/K_y = 1/k_y + m/k_x;  N = K_y (y - m x)
#   (L/V)_min = (y_b - y_a) / (y_b/m - x_a);  A = L/(mV)
#   NTU_OG = ln[(1 - 1/A)(y_b - m x_a)/(y_a - m x_a) + 1/A] / (1 - 1/A);  Z = HTU_OG × NTU_OG
using Printf

function two_film(y, x, m, ky, kx)
    Ky = 1 / (1 / ky + m / kx)
    N = Ky * (y - m * x)
    return N, y - N / ky, x + N / kx, Ky, (1 / ky) / (1 / Ky)
end

function ntu_numeric(yb, ya, xa, LV, m; n = 20000)
    h = (yb - ya) / n
    s = 0.0
    for i in 0:n
        y = ya + i * h
        x = xa + (y - ya) / LV
        s += (i == 0 || i == n ? 0.5 : 1.0) / (y - m * x)
    end
    return s * h
end

function ntu_colburn(yb, ya, xa, LV, m)
    A = LV / m
    return log((1 - 1 / A) * (yb - m * xa) / (ya - m * xa) + 1 / A) / (1 - 1 / A)
end

function main()
    println("Topic 4 — two-resistance theory and packed-tower design\n")
    println("[1] Two films in series: k_y = 1e-3, k_x = 5e-3 kmol/(m2 s), y = 0.05, x = 0")
    println("        system          m        K_y          gas-film share   y_i       x_i")
    for (name, m) in (("very soluble (NH3-like)", 0.8), ("moderate", 30.0), ("sparingly soluble (O2-like)", 4.3e4))
        N, yi, xi, Ky, share = two_film(0.05, 0.0, m, 1e-3, 5e-3)
        @printf("   %-28s %8.3g   %.3e    %6.2f %%      %.5f   %.3e\n", name, m, Ky, share * 100, yi, xi)
    end
    println("   (Small m: gas film controls. Large m: liquid film controls.)\n")

    println("[2] Dilute absorber: y_b = 0.020 in, 95% recovery, clean solvent x_a = 0, m = 1.2")
    yb, xa, m = 0.020, 0.0, 1.2
    ya = yb * (1 - 0.95)
    LVmin = (yb - ya) / (yb / m - xa)
    @printf("   y_a = %.4f,  (L/V)_min = %.4f\n", ya, LVmin)
    for f in (1.1, 1.5, 2.0, 3.0)
        LV = f * LVmin; A = LV / m; xb = xa + (yb - ya) / LV
        @printf("   L/V = %.1f×min = %.4f   A = %.3f   x_b = %.5f   NTU_OG = %.3f (numerical %.3f)\n",
                f, LV, A, xb, ntu_colburn(yb, ya, xa, LV, m), ntu_numeric(yb, ya, xa, LV, m))
    end
    println()
    println("[3] Height: G_M = 0.020 kmol/(m2 s), K_y a = 0.040 kmol/(m3 s)  ->  HTU_OG = 0.50 m")
    HTU = 0.020 / 0.040
    for f in (1.1, 1.5, 2.0)
        @printf("   L/V = %.1f×min   Z = HTU × NTU = %.2f m\n", f, HTU * ntu_colburn(yb, ya, xa, f * LVmin, m))
    end
end

main()
