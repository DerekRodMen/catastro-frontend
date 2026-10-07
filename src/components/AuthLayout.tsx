import {
  type ReactNode,
} from 'react';

import imagenGrecia
  from '../assets/grecia-login.jpg';

import './AuthLayout.css';


interface AuthLayoutProps {
  children: ReactNode;

  ancho?: 'normal' | 'amplio';
}


export default function AuthLayout({
  children,
  ancho = 'normal',
}: AuthLayoutProps) {

  return (

    <div className="auth-layout">

      {/* FOTO REAL DE GRECIA */}

      <div
        className="auth-layout__background"
        style={{
          backgroundImage:
            `url(${imagenGrecia})`,
        }}
      />


      {/* CAPA DE CONTRASTE */}

      <div
        className="auth-layout__overlay"
      />


      {/* CONTENIDO */}

      <main
        className={
          ancho === 'amplio'
            ? 'auth-layout__content auth-layout__content--wide'
            : 'auth-layout__content'
        }
      >

        <section
          className="auth-layout__brand"
        >

          <p
            className="auth-layout__municipality"
          >
            MUNICIPALIDAD DE GRECIA
          </p>

          <h1>
            Sistema de Catastro
          </h1>

          <p
            className="auth-layout__subtitle"
          >
            Panel Administrativo
          </p>

        </section>


        {children}


        <p
          className="auth-layout__footer"
        >
          Municipalidad de Grecia · Gobierno Local
        </p>

      </main>

    </div>

  );
}