// Smooth Scroll para âncoras
$(document).on('click', 'a[href^="#"]', function(event) {
  var target = $(this.getAttribute('href'));
  if (target.length) {
    event.preventDefault();
    $('html, body').animate({
      scrollTop: target.offset().top - 70
    }, 600);
  }
});

// Redireciona para index.html se hash não existir na página atual
(function() {
  var validHashes = ['#home', '#contato', '#horarios'];
  if (window.location.pathname.match(/menu\.html$/) && validHashes.includes(window.location.hash)) {
    window.location.href = 'index.html' + window.location.hash;
  }
})();

// --- Sistema de Reservas Avançado ---
const HORARIOS = {
  0: {abertura: '12:00', fechamento: '20:00'}, // Domingo
  1: {abertura: '11:00', fechamento: '22:00'}, // Segunda
  2: {abertura: '11:00', fechamento: '22:00'}, // Terça
  3: {abertura: '11:00', fechamento: '22:00'}, // Quarta
  4: {abertura: '11:00', fechamento: '22:00'}, // Quinta
  5: {abertura: '11:00', fechamento: '22:00'}, // Sexta
  6: {abertura: '12:00', fechamento: '23:00'}, // Sábado
};
const ZONAS = {
  janela: 'Vista Janela',
  centro: 'Área Central',
  cozinha: 'Próx. Cozinha',
  entrada: 'Perto da Entrada'
};
const MESAS = [
  {id:'T1', zona:'janela', seats:4, pos:[1,1]},
  {id:'T2', zona:'janela', seats:2, pos:[1,2]},
  {id:'T3', zona:'janela', seats:4, pos:[1,3]},
  {id:'T4', zona:'centro', seats:6, pos:[2,2]},
  {id:'T5', zona:'centro', seats:4, pos:[2,3]},
  {id:'T6', zona:'centro', seats:2, pos:[2,4]},
  {id:'T7', zona:'cozinha', seats:4, pos:[3,1]},
  {id:'T8', zona:'cozinha', seats:2, pos:[3,2]},
  {id:'T9', zona:'entrada', seats:2, pos:[4,1]},
  {id:'T10', zona:'entrada', seats:4, pos:[4,2]},
];
let statusMesas = {};
let reserva = { data: '', hora: '', mesa: '', nome: '', telefone: '', email: '', pedidos: '', pagamento: '', pagamentoQuando: '' };

function salvarStatusLocal() {
  localStorage.setItem('statusMesas', JSON.stringify(statusMesas));
}
function carregarStatusLocal() {
  const s = localStorage.getItem('statusMesas');
  if (s) statusMesas = JSON.parse(s);
  else MESAS.forEach(m=>statusMesas[m.id]='disponivel');
}
function gerarStatusAleatorio() {
  MESAS.forEach(mesa => {
    const r = Math.random();
    if (r < 0.7) statusMesas[mesa.id] = 'disponivel';
    else if (r < 0.85) statusMesas[mesa.id] = 'reservada';
    else statusMesas[mesa.id] = 'ocupada';
  });
  salvarStatusLocal();
}
function renderizarHorariosValidos() {
  const data = $('#reserva-data').val();
  const $hora = $('#reserva-hora');
  $hora.empty();
  if (!data) return;
  const dia = new Date(data).getDay();
  const {abertura, fechamento} = HORARIOS[dia];
  let [hA, mA] = abertura.split(':').map(Number);
  let [hF, mF] = fechamento.split(':').map(Number);
  let slots = [];
  for (let h = hA; h <= hF; h++) {
    for (let m = 0; m < 60; m += 30) {
      if ((h === hA && m < mA) || (h === hF && m > mF)) continue;
      let label = (h<10?'0':'')+h+':'+(m===0?'00':m);
      slots.push(label);
    }
  }
  slots.forEach(s=> $hora.append(`<option value="${s}">${s}</option>`));
  $hora.prop('disabled', slots.length===0);
}
function renderizarMapaMesas() {
  const $mapa = $('#mapa-mesas');
  $mapa.empty();
  MESAS.forEach(mesa => {
    const status = statusMesas[mesa.id] || 'disponivel';
    const $btn = $('<div></div>')
      .addClass('mesa zona-'+mesa.zona+' '+status)
      .attr('data-id', mesa.id)
      .attr('tabindex',0)
      .html(`<span>${mesa.id}</span><span class='mesa-label'>${mesa.seats}p</span><span class='mesa-zona'>${ZONAS[mesa.zona]}</span>`)
      .toggleClass('selecionada', reserva.mesa === mesa.id)
      .on('mouseenter focus', function(){
        $('#mesa-info').html(`<b>${mesa.id}</b> - ${ZONAS[mesa.zona]}<br>Lugares: ${mesa.seats}`);
      })
      .on('mouseleave blur', function(){
        $('#mesa-info').empty();
      });
    if (status === 'disponivel') {
      $btn.on('click keypress', function(e) {
        if (e.type==='click' || e.key==='Enter') {
          reserva.mesa = mesa.id;
          renderizarMapaMesas();
          $('#btn-to-form').prop('disabled', false);
        }
      });
    }
    $mapa.append($btn);
  });
}
function atualizarStatusMesas() {
  carregarStatusLocal();
  renderizarMapaMesas();
}
function avancarEtapa(atual, proxima) {
  $('.reserva-step').removeClass('active').addClass('d-none');
  $(proxima).addClass('active').removeClass('d-none');
}
$(document).ready(function(){
  carregarStatusLocal();
  renderizarMapaMesas();
  // Etapa 1: Data/Hora
  $('#reserva-data').on('change', function(){
    renderizarHorariosValidos();
    $('#btn-to-mapa').prop('disabled', !$('#reserva-data').val() || !$('#reserva-hora').val());
  });
  $('#reserva-hora').on('change', function(){
    $('#btn-to-mapa').prop('disabled', !$('#reserva-data').val() || !$('#reserva-hora').val());
  });
  $('#btn-to-mapa').on('click', function(){
    reserva.data = $('#reserva-data').val();
    reserva.hora = $('#reserva-hora').val();
    avancarEtapa('#step-horario','#step-mapa');
    renderizarMapaMesas();
    $('#btn-to-form').prop('disabled', !reserva.mesa);
  });
  $('#btn-back-horario').on('click', function(){ avancarEtapa('#step-mapa','#step-horario'); });
  // Etapa 2: Mapa Mesas
  $('#btn-to-form').on('click', function(){
    if (!reserva.mesa) return;
    avancarEtapa('#step-mapa','#step-form');
  });
  $('#btn-back-mapa').on('click', function(){ avancarEtapa('#step-form','#step-mapa'); });
  // Etapa 3: Formulário Cliente
  $('#reserva-form').on('submit', function(e){ e.preventDefault(); });
  $('#btn-to-pagamento').on('click', function(){
    reserva.nome = $('#reserva-nome').val();
    reserva.telefone = $('#reserva-telefone').val();
    reserva.email = $('#reserva-email').val();
    reserva.pedidos = $('#reserva-pedidos').val();
    if (!reserva.nome || !reserva.telefone) {
      alert('Preencha nome e telefone!');
      return;
    }
    avancarEtapa('#step-form','#step-pagamento');
  });
  $('#btn-back-form').on('click', function(){ avancarEtapa('#step-pagamento','#step-form'); });
  // Etapa 4: Pagamento
  $('#btn-confirmar').on('click', function(){
    const metodo = $('input[name="pagamento"]:checked').val();
    const quando = $('#pagamento-quando').val();
    if (!metodo || !quando) {
      alert('Selecione o método e o momento do pagamento!');
      return;
    }
    reserva.pagamento = metodo;
    reserva.pagamentoQuando = quando;
    // Atualiza status da mesa
    statusMesas[reserva.mesa] = 'reservada';
    salvarStatusLocal();
    // Resumo
    $('#resumo-reserva').html(
      `<b>Data:</b> ${reserva.data}<br><b>Hora:</b> ${reserva.hora}<br><b>Mesa:</b> ${reserva.mesa}<br><b>Nome:</b> ${reserva.nome}<br><b>Telefone:</b> ${reserva.telefone}<br><b>Pagamento:</b> ${reserva.pagamento} (${reserva.pagamentoQuando==='antecipado'?'Antecipado':'No local'})`
    );
    avancarEtapa('#step-pagamento','#step-confirmacao');
    setTimeout(atualizarStatusMesas, 1000);
  });
  $('#btn-nova-reserva').on('click', function(){ location.reload(); });
  // Atualização "em tempo real" a cada 10s
  setInterval(atualizarStatusMesas, 10000);
  // Inicialização
  $('.reserva-step').removeClass('active').addClass('d-none');
  $('#step-horario').addClass('active').removeClass('d-none');
  renderizarHorariosValidos();
}); 