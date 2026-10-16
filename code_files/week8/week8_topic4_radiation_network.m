% Week 8 - Topic 4: View Factors & Gray-Surface Radiation Networks
% View factor F12: fraction of energy leaving A1 that reaches A2;
% reciprocity A1 F12 = A2 F21; summation sum_j Fij = 1 (closed enclosure).
% Gray surface: radiosity J = rho G + eps Eb; resistances rho/(eps A), 1/(A F12).
% n-surface system: (1 - Fii + eps_i/rho_i) J_i - sum_j J_j F_ij = (eps_i/rho_i) Eb_i
% Reproduces the lecture 3-surface example (sigma = 5.676e-8, classic value):
% black -> q1 = 328.3 kW; gray (0.4/0.8/1) -> J1 = 33,900, J2 = 5,510, q1 = 131.2 kW.

clear; clc;

SIGMA_LECTURE = 5.676e-8;  SIGMA_MODERN = 5.670e-8;

% --- view-factor sanity checks against the lecture charts ---
fprintf('View factors:\n');
fprintf('  squares side/dist = 1: F12 = %.4f (chart ~0.20)\n', f_rect(1,1));
fprintf('  squares side/dist = 2: F12 = %.4f (chart ~0.41)\n', f_rect(2,2));
fprintf('  equal disks r/D = 1  : F12 = %.4f (chart ~0.38)\n', f_disks(1,1,1));
fprintf('  hemisphere over base : F12 = 1/2 (reciprocity)\n');
fprintf('  concentric spheres   : F12 = 1, F21 = (r1/r2)^2\n\n');

% --- lecture 3-surface example ---
sig = SIGMA_LECTURE;
T  = [1100 550 0];
Eb = sig * T.^4;
F  = [0 0.2 0.3; 0.2 0 0.8; 0.2 0.2 0.6];
A1 = 4;
fprintf('3-surface enclosure: Eb1 = %.0f, Eb2 = %.0f W/m^2\n', Eb(1), Eb(2));

% (a) all black
q1 = A1*(Eb(1) - F(1,2)*Eb(2) - F(1,3)*Eb(3));
fprintf('  (a) all black: q1 = %.1f kW (lecture 328.3)\n', q1/1e3);

% (b) surfaces 1,2 black, surface 3 re-radiating (q3 = 0)
J3 = (Eb(1)*F(3,1) + Eb(2)*F(3,2)) / (1 - F(3,3));
q1b = A1*(Eb(1) - F(1,2)*Eb(2) - F(1,3)*J3);
q2b = A1*(Eb(2) - F(2,1)*Eb(1) - F(2,3)*J3);
fprintf('  (b) 3 re-radiating: J3 = %.0f, q1 = %.1f kW, |q2| = %.1f kW (lecture 187.0)\n', ...
        J3, q1b/1e3, abs(q2b)/1e3);

% (c) gray: eps = (0.4, 0.8, 1.0) -> Gauss-Seidel on the radiosity system
eps_ = [0.4 0.8 1.0];
J = Eb;
for it = 1:500
    for i = 1:3
        rho = 1 - eps_(i);
        if rho < 1e-12, J(i) = Eb(i); continue; end
        c = eps_(i)/rho;
        s = F(i,:)*J' - F(i,i)*J(i);
        J(i) = (c*Eb(i) + s) / (1 - F(i,i) + c);
    end
end
q1c = A1*eps_(1)/(1-eps_(1))*(Eb(1) - J(1));
fprintf('  (c) gray (0.4/0.8/1): J1 = %.0f (lect 33,900), J2 = %.0f (lect 5,510)\n', ...
        J(1), J(2));
fprintf('      q1 = %.1f kW (lecture 131.2)\n\n', q1c/1e3);

% --- radiation heat-transfer coefficient ---
T1 = 400; T2 = 300; sig = SIGMA_MODERN;
hr = 4*sig*T1^3;
fprintf('h_r = 4 sigma T1^3 = %.2f W/m^2 K (T1 = 400 K)\n', hr);
fprintf('exact sigma(T1^4-T2^4) = %.0f vs h_r dT = %.0f W/m^2\n', ...
        sig*(T1^4 - T2^4), hr*(T1 - T2));
fprintf('-> linearization good only for T1 - T2 << T1\n');

function F12 = f_rect(X, Y)
    % directly opposed parallel rectangles, X = a/c, Y = b/c
    x2 = 1 + X^2; y2 = 1 + Y^2;
    s = log(sqrt(x2*y2/(1 + X^2 + Y^2))) ...
      + X*sqrt(y2)*atan(X/sqrt(y2)) + Y*sqrt(x2)*atan(Y/sqrt(x2)) ...
      - X*atan(X) - Y*atan(Y);
    F12 = 2/(pi*X*Y) * s;
end

function F12 = f_disks(r1, r2, D)
    R1 = r1/D; R2 = r2/D;
    X = 1 + (1 + R2^2)/R1^2;
    F12 = 0.5*(X - sqrt(X^2 - 4*(r2/r1)^2));
end
