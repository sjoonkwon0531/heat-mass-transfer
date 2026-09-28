% Week 5 - Topic 1: Blasius Boundary Layer by the Shooting Method
% f*f'' + 2*f''' = 0, f(0) = f'(0) = 0, f'(inf) = 1
% Shooting + secant on f''(0). Results: f''(0) = 0.332057, beta = 1.720787.

function week5_topic1_blasius_shooting
    close all; clc
    % --- secant iteration on g(fpp0) = f'(zmax) - 1 ---
    a = 0.2; b = 0.5;
    ga = endslope(a) - 1; gb = endslope(b) - 1;
    for it = 1:40
        c = b - gb*(b - a)/(gb - ga);
        gc = endslope(c) - 1;
        a = b; ga = gb; b = c; gb = gc;
        if abs(gc) < 1e-12, break; end
    end
    fpp0 = b;
    fprintf('Shooting result: f''''(0) = %.6f   (lecture: 0.332057)\n', fpp0);

    [z, Y] = march(fpp0);
    i99 = find(Y(:,2) >= 0.99, 1);
    fprintf('f'' = 0.99 at zeta = %.2f -> delta_99 ~ 5.0*x/sqrt(Re_x)\n', z(i99));
    fprintf('beta = lim(zeta - f) = %.6f (lecture: 1.720787)\n', z(end) - Y(end,1));

    figure(1);
    subplot(1,3,1); plot(Y(:,1), z, 'LineWidth', 1.5); grid on
    xlabel('f'); ylabel('\zeta'); title('Stream function');
    subplot(1,3,2); plot(Y(:,2), z, 'LineWidth', 1.5); grid on
    xlabel('f'' = v_x/v_\infty'); ylabel('\zeta'); title('Velocity profile');
    subplot(1,3,3); plot(Y(:,3), z, 'LineWidth', 1.5); grid on
    xlabel('f'''''); ylabel('\zeta'); title('Shear function');

    % Drag & worked example
    fprintf('\n2*f''''(0) = %.4f (the 0.664 prefactor); C_f = 1.328/sqrt(Re_L)\n', 2*fpp0);
    nu = 15.9e-6; U = 5; L = 0.5;
    fprintf('Air, U = %g m/s, L = %g m -> Re_L = %.3e (laminar)\n', U, L, U*L/nu);
    for x = [0.05 0.1 0.25 0.5]
        Rex = U*x/nu;
        fprintf('  x = %4.2f m: delta_99 = %5.2f mm, c_f = %.5f\n', ...
                x, 5.0*x/sqrt(Rex)*1e3, 0.664/sqrt(Rex));
    end
end

function fp_end = endslope(fpp0)
    [~, Y] = march(fpp0);
    fp_end = Y(end, 2);
end

function [z, Y] = march(fpp0)
    dz = 0.001; zmax = 10;
    n = round(zmax/dz);
    z = (0:n)' * dz;
    Y = zeros(n+1, 3);
    Y(1,:) = [0 0 fpp0];
    y = Y(1,:)';
    for i = 1:n
        k1 = f_rhs(y); k2 = f_rhs(y + dz/2*k1);
        k3 = f_rhs(y + dz/2*k2); k4 = f_rhs(y + dz*k3);
        y = y + dz/6*(k1 + 2*k2 + 2*k3 + k4);
        Y(i+1,:) = y';
    end
end

function dy = f_rhs(y)
    dy = [y(2); y(3); -0.5*y(1)*y(3)];
end
