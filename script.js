// Variables globales
let currentDrinks = [];
let currentInstructionsCard = null;

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Inicializar la aplicación
function initializeApp() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const loadingElement = document.getElementById('loading');
    
    // Cargar cócteles populares al inicio
    loadPopularCocktails();
    
    // Event listeners
    searchButton.addEventListener('click', handleSearch);
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Limpiar mensajes de error al escribir
    searchInput.addEventListener('input', () => {
        clearErrorMessages();
    });
}

// Manejar la búsqueda
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm === '') {
        showError('Por favor, ingresa un término de búsqueda');
        return;
    }
    
    searchCocktails(searchTerm);
}

// Buscar cócteles
async function searchCocktails(searchTerm) {
    const loadingElement = document.getElementById('loading');
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Mostrar carga
    showLoading(true);
    resultsContainer.innerHTML = '';
    clearErrorMessages();
    
    try {
        const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ocultar carga
        showLoading(false);
        
        if (data.drinks === null) {
            resultsContainer.innerHTML = '<div class="no-results">No se encontraron resultados para tu búsqueda</div>';
            return;
        }
        
        currentDrinks = data.drinks;
        displayResults(data.drinks);
    } catch (error) {
        console.error('Error fetching data:', error);
        showLoading(false);
        showError('Error al cargar los datos. Intenta nuevamente.');
    }
}

// Cargar cócteles populares al inicio
async function loadPopularCocktails() {
    const popularCocktails = ['margarita', 'mojito', 'cosmopolitan', 'martini', 'daiquiri'];
    const randomCocktail = popularCocktails[Math.floor(Math.random() * popularCocktails.length)];
    
    try {
        const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${randomCocktail}`);
        const data = await response.json();
        
        if (data.drinks) {
            currentDrinks = data.drinks;
            displayResults(data.drinks);
            
            // Establecer el valor del input
            document.getElementById('searchInput').value = randomCocktail;
        }
    } catch (error) {
        console.error('Error loading popular cocktails:', error);
    }
}

// Mostrar resultados
function displayResults(drinks) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';
    
    drinks.forEach(drink => {
        const card = createCocktailCard(drink);
        resultsContainer.appendChild(card);
    });
    
    // Añadir event listeners a los botones
    document.querySelectorAll('.instructions-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const drinkId = e.target.getAttribute('data-id');
            const drink = drinks.find(d => d.idDrink === drinkId);
            showInstructions(drink);
        });
    });
}

// Crear tarjeta de cóctel
function createCocktailCard(drink) {
    const card = document.createElement('div');
    card.className = 'cocktail-card';
    
    card.innerHTML = `
        <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}" class="cocktail-image" onerror="this.src='https://via.placeholder.com/300x250/cccccc/969696?text=Imagen+no+disponible'">
        <div class="cocktail-info">
            <h2 class="cocktail-name">${drink.strDrink}</h2>
            <p class="cocktail-category">${drink.strCategory}${drink.strAlcoholic === 'Alcoholic' ? ' (Alcohólico)' : ' (No alcohólico)'}</p>
            <button class="instructions-btn" data-id="${drink.idDrink}">Ver Instrucciones</button>
        </div>
    `;
    
    return card;
}

// Mostrar instrucciones
function showInstructions(drink) {
    // Cerrar instrucciones previas si las hay
    if (currentInstructionsCard) {
        currentInstructionsCard.remove();
    }
    
    // Crear tarjeta de instrucciones
    const instructionsCard = document.createElement('div');
    instructionsCard.className = 'instructions-card';
    
    // Obtener ingredientes
    let ingredients = '';
    for (let i = 1; i <= 15; i++) {
        const ingredient = drink[`strIngredient${i}`];
        const measure = drink[`strMeasure${i}`];
        
        if (ingredient && ingredient.trim() !== '') {
            ingredients += `<li>${measure ? measure.trim() : ''} ${ingredient}</li>`;
        }
    }
    
    // Usar instrucciones en español si están disponibles, sino usar las en inglés
    const instructions = drink.strInstructionsES || drink.strInstructions || 'No hay instrucciones disponibles.';
    
    instructionsCard.innerHTML = `
        <span class="close-btn">&times;</span>
        <h2 class="instructions-title">${drink.strDrink} - Preparación</h2>
        <p class="instructions-text">${instructions}</p>
        <h3 style="margin-top: 15px; color: #333;">Ingredientes:</h3>
        <ul class="ingredients-list">
            ${ingredients}
        </ul>
    `;
    
    // Insertar después de la tarjeta correspondiente
    const drinkCard = document.querySelector(`.instructions-btn[data-id="${drink.idDrink}"]`).closest('.cocktail-card');
    drinkCard.parentNode.insertBefore(instructionsCard, drinkCard.nextSibling);
    
    // Guardar referencia a la tarjeta actual
    currentInstructionsCard = instructionsCard;
    
    // Mostrar la tarjeta
    setTimeout(() => {
        instructionsCard.style.display = 'block';
    }, 10);
    
    // Event listener para cerrar
    instructionsCard.querySelector('.close-btn').addEventListener('click', () => {
        instructionsCard.style.display = 'none';
        setTimeout(() => {
            instructionsCard.remove();
            currentInstructionsCard = null;
        }, 300);
    });
    
    // Cerrar al hacer clic fuera de la tarjeta
    document.addEventListener('click', function closeInstructionsOnClickOutside(e) {
        if (instructionsCard && !instructionsCard.contains(e.target) && 
            !e.target.classList.contains('instructions-btn')) {
            instructionsCard.style.display = 'none';
            setTimeout(() => {
                if (instructionsCard.parentNode) {
                    instructionsCard.remove();
                }
                currentInstructionsCard = null;
            }, 300);
            document.removeEventListener('click', closeInstructionsOnClickOutside);
        }
    });
}

// Mostrar u ocultar la animación de carga
function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = show ? 'flex' : 'none';
}

// Mostrar mensaje de error
function showError(message) {
    clearErrorMessages();
    
    const searchContainer = document.querySelector('.search-container');
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    searchContainer.appendChild(errorElement);
}

// Limpiar mensajes de error
function clearErrorMessages() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
}