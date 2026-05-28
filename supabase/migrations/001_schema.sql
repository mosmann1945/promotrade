-- PROMOTRADE — Execute no Supabase SQL Editor

create table if not exists roteiros (
  id serial primary key, numero integer not null unique,
  descricao text, ativo boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists lojas (
  id serial primary key, roteiro_id integer references roteiros(id) on delete cascade,
  nome text not null, rede text, cidade text, endereco text, cnpj text,
  seg boolean default false, ter boolean default false, qua boolean default false,
  qui boolean default false, sex boolean default false, sab boolean default false,
  ativa boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists marcas (
  id serial primary key, codigo text not null unique, nome text not null,
  tempo_padrao_min integer default 10, ativa boolean default true, ordem integer default 0
);
create table if not exists loja_marcas (
  id serial primary key, loja_id integer references lojas(id) on delete cascade,
  marca_id integer references marcas(id) on delete cascade,
  tempo_min integer, unique(loja_id, marca_id)
);
create table if not exists parametros (
  id serial primary key, chave text not null unique, valor text not null, descricao text
);
create table if not exists importacoes (
  id serial primary key, arquivo text, tipo text, registros integer,
  status text, detalhes text, created_at timestamptz default now()
);

-- Dados iniciais
insert into parametros (chave,valor,descricao) values
  ('dias_semana','6','Dias trabalhados por semana'),
  ('horas_dia','8','Horas contratadas por dia'),
  ('desloc_min','20','Deslocamento médio entre lojas (min)'),
  ('limite_alerta','80','Percentual de ocupação para alerta (%)')
on conflict (chave) do nothing;

insert into marcas (codigo,nome,tempo_padrao_min,ordem) values
  ('MOS','MOSMANN',30,1),('AST','ASTORIA',45,2),('FLO','FLORESTAL',45,3),
  ('XIM','XIMANGO',30,4),('WEB','WEBER',15,5),('FIL','FILOS',15,6),
  ('SAK','SAKURA',15,7),('BRA','BRASIL BEVERAGES',30,8),('ODA','ODARA',30,9),
  ('AVA','AVANT',15,10),('CRIS','CRISTAL COPOS/ROFERC',30,11),('COT','COTTON',45,12),
  ('ARB','ARBOLÊ',30,13),('REG','REGINA',30,14),('DSA','DOCES SANTO ANTONIO',45,15),
  ('LAF','LAFRA',15,16),('MAR','MARQUEZ',15,17),('PBC','PBCAT',30,18),
  ('TUT','TUTTI',30,19),('ESS','ESSENTIAL',15,20),('FFKR','FFKR',15,21),
  ('JHN','PIPOCA DO JOHNNY',15,22)
on conflict (codigo) do nothing;

-- RLS
alter table roteiros    enable row level security;
alter table lojas       enable row level security;
alter table marcas      enable row level security;
alter table loja_marcas enable row level security;
alter table parametros  enable row level security;
alter table importacoes enable row level security;

create policy "all" on roteiros    for all using (true);
create policy "all" on lojas       for all using (true);
create policy "all" on marcas      for all using (true);
create policy "all" on loja_marcas for all using (true);
create policy "all" on parametros  for all using (true);
create policy "all" on importacoes for all using (true);
